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
  cors: {
    origin: '*',
  },
})
export class TerminalGateway {
  @WebSocketServer()
  server: Server;

  private terminals = new Map<
    string,
    {
      process: ChildProcessWithoutNullStreams;
      tempDir: string;
      filename: string;
      language: string;
    }
  >();

  // 🧠 Handle starting a code execution session
  @SubscribeMessage('start-execution')
  async handleStart(
    @MessageBody()
    data: {
      language: string;
      code: string;
      filename?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const requestedLanguage = data.language?.toLowerCase();
    if (!requestedLanguage) {
      client.emit('stderr', 'Language is required to execute code.');
      return;
    }

    // Stop any previous execution for this client before starting a new one
    this.stopSession(client.id, false);

    const tempDir = path.join(
      __dirname,
      '../../temp',
      crypto.randomBytes(8).toString('hex'),
    );

    try {
      fs.mkdirSync(tempDir, { recursive: true });
      const fileName = data.filename || this.getDefaultFile(requestedLanguage);
      const filePath = path.join(tempDir, fileName);
      fs.writeFileSync(filePath, data.code ?? '', { encoding: 'utf8' });

      const dockerCmd = this.getDockerCommand(requestedLanguage, fileName, tempDir);

      // 🧠 Start Docker in interactive mode
      const child = spawn('docker', dockerCmd, {
        cwd: tempDir,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const session = {
        process: child,
        tempDir,
        filename: fileName,
        language: requestedLanguage,
      };

      this.terminals.set(client.id, session);
      client.emit('started', {
        filename: fileName,
        language: requestedLanguage,
      });

      child.stdout.on('data', (chunk) => {
        client.emit('stdout', chunk.toString());
      });

      child.stderr.on('data', (chunk) => {
        client.emit('stderr', chunk.toString());
      });

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

  @SubscribeMessage('input')
  handleInput(@MessageBody() input: string, @ConnectedSocket() client: Socket) {
    const session = this.terminals.get(client.id);
    if (!session) {
      client.emit('stderr', 'No active session to receive input.');
      return;
    }

    session.process.stdin.write(`${input}\n`);
  }

  @SubscribeMessage('stop')
  handleStop(@ConnectedSocket() client: Socket) {
    const session = this.terminals.get(client.id);
    if (!session) {
      client.emit('stopped');
      return;
    }

    session.process.kill('SIGTERM');
    client.emit('stopped');
  }

  handleDisconnect(client: Socket) {
    this.stopSession(client.id);
  }

  private stopSession(clientId: string, notify = true) {
    const session = this.terminals.get(clientId);
    if (!session) {
      return;
    }

    session.process.kill('SIGTERM');
    if (notify) {
      this.safeRemove(session.tempDir);
      this.terminals.delete(clientId);
    }
  }

  private safeRemove(targetPath: string) {
    try {
      fs.rmSync(targetPath, { recursive: true, force: true });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Failed to remove temp directory ${targetPath}:`, error);
    }
  }

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

  private getDockerCommand(lang: string, filename: string, tempDir: string): string[] {
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
