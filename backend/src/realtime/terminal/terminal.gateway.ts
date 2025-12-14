/**
 * TerminalGateway
 * ----------------
 * Provides real-time code execution in isolated Docker containers via WebSocket.
 * Handles multi-language code runs (Python, C++, JavaScript), live input/output streams,
 * and secure cleanup of temporary workspaces per client.
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class TerminalGateway {
  @WebSocketServer()
  server: Server;

  /**
   * Maps client IDs to their active execution sessions.
   * Each session tracks its Docker process and temporary workspace.
   */
  private readonly terminals = new Map<
    string,
    {
      process: ChildProcessWithoutNullStreams;
      tempDir: string;
      filename: string;
      language: string;
    }
  >();

  /* -------------------------------------------------------------
   * START EXECUTION
   * ------------------------------------------------------------- */

  /**
   * Starts a new code execution session for the client.
   * Creates a temporary folder, writes the provided code, and spawns a Docker container.
   */
  @SubscribeMessage('start-execution')
  async handleStart(
    @MessageBody()
    data: { language: string; code: string; filename?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const requestedLanguage = data.language?.toLowerCase();
    if (!requestedLanguage) {
      client.emit('stderr', 'Language is required to execute code.');
      return;
    }

    // Stop any existing session for this client
    this.stopSession(client.id, false);

    const tempDir = path.join(
      __dirname,
      '../../../temp',
      crypto.randomBytes(8).toString('hex'),
    );

    try {
      fs.mkdirSync(tempDir, { recursive: true });
      const fileName = data.filename || this.getDefaultFile(requestedLanguage);
      const filePath = path.join(tempDir, fileName);
      fs.writeFileSync(filePath, data.code ?? '', { encoding: 'utf8' });

      const dockerCmd = this.getDockerCommand(
        requestedLanguage,
        fileName,
        tempDir,
      );

      // Launch Docker in isolated interactive mode
      const child = spawn('docker', dockerCmd, {
        cwd: tempDir,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.terminals.set(client.id, {
        process: child,
        tempDir,
        filename: fileName,
        language: requestedLanguage,
      });

      client.emit('started', {
        filename: fileName,
        language: requestedLanguage,
      });

      // Stream container output back to the client
      child.stdout.on('data', (chunk) =>
        client.emit('stdout', chunk.toString()),
      );
      child.stderr.on('data', (chunk) =>
        client.emit('stderr', chunk.toString()),
      );

      child.on('error', (error) => {
        client.emit('stderr', `Failed to start execution: ${error.message}`);
      });

      child.on('close', (code) => {
        this.safeRemove(tempDir);
        const activeSession = this.terminals.get(client.id);
        if (activeSession && activeSession.process === child) {
          this.terminals.delete(client.id);
          client.emit('exit', { code });
        }
      });
    } catch (error) {
      this.safeRemove(tempDir);
      const message =
        error instanceof Error ? error.message : 'Unknown execution error.';
      client.emit('stderr', `Execution setup failed: ${message}`);
    }
  }

  /* -------------------------------------------------------------
   * INPUT & STOP
   * ------------------------------------------------------------- */

  /**
   * Handles input from the user to send to the running Docker process (stdin).
   */
  @SubscribeMessage('input')
  handleInput(@MessageBody() input: string, @ConnectedSocket() client: Socket) {
    const session = this.terminals.get(client.id);
    if (!session) {
      client.emit('stderr', 'No active session to receive input.');
      return;
    }
    session.process.stdin.write(`${input}\n`);
  }

  /**
   * Stops the currently running execution for the connected client.
   * Kills the Docker container and cleans up temporary files.
   */
  @SubscribeMessage('stop')
  handleStop(@ConnectedSocket() client: Socket) {
    this.stopSession(client.id, true, client);
  }

  /**
   * Cleans up resources when a client disconnects unexpectedly.
   */
  handleDisconnect(client: Socket) {
    this.stopSession(client.id);
  }

  /* -------------------------------------------------------------
   * INTERNAL HELPERS
   * ------------------------------------------------------------- */

  /**
   * Stops and removes the execution session for a given client.
   */
  private stopSession(clientId: string, notify = true, client?: Socket) {
    const session = this.terminals.get(clientId);
    if (!session) return;

    session.process.kill('SIGTERM');
    // Force kill if the process ignores SIGTERM
    const killTimer = setTimeout(() => {
      session.process.kill('SIGKILL');
    }, 500);

    if (notify) {
      session.process.once('exit', () => clearTimeout(killTimer));
      session.process.once('close', () => clearTimeout(killTimer));
      this.safeRemove(session.tempDir);
      this.terminals.delete(clientId);
      client?.emit('stopped');
    }
  }

  /**
   * Recursively removes the temporary workspace.
   */
  private safeRemove(targetPath: string) {
    try {
      fs.rmSync(targetPath, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to remove temp directory ${targetPath}:`, error);
    }
  }

  /**
   * Returns the default filename for a given language.
   */
  private getDefaultFile(lang: string) {
    switch (lang) {
      case 'python':
        return 'main.py';
      case 'cpp':
        return 'main.cpp';
      case 'javascript':
        return 'main.js';
      default:
        return 'main.txt';
    }
  }

  /**
   * Builds the correct Docker command for the given language.
   */
  private getDockerCommand(
    lang: string,
    filename: string,
    tempDir: string,
  ): string[] {
    switch (lang) {
      case 'python':
        return [
          'run',
          '-i',
          '--rm',
          '-v',
          `${tempDir}:/app`,
          'python:3.11',
          'python',
          `/app/${filename}`,
        ];
      case 'cpp':
        return [
          'run',
          '-i',
          '--rm',
          '-v',
          `${tempDir}:/app`,
          'gcc:latest',
          'bash',
          '-c',
          `g++ /app/${filename} -o /app/a.out && /app/a.out`,
        ];
      case 'javascript':
        return [
          'run',
          '-i',
          '--rm',
          '-v',
          `${tempDir}:/app`,
          'node:20',
          'node',
          `/app/${filename}`,
        ];
      default:
        throw new Error(`Unsupported language: ${lang}`);
    }
  }
}
