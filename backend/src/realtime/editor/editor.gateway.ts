/**
 * EditorGateway
 * ---------------
 * Handles real-time collaborative editing using WebSockets and Operational Transformation (OT).
 * Synchronizes file content between multiple users in real time while maintaining consistency.
 */

import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { FileService } from '../../file/file.service';
import {
  TextOperation,
  applyOperation as applyTextOperation,
  normalizeOperation,
  transformOperation,
} from './text-ot';

/** -------------------- Types -------------------- */

type ClientOperationPayload = {
  fileId: number;
  version: number;
  components: TextOperation;
  clientId: string;
};

type DocumentHistoryEntry = {
  version: number;
  components: TextOperation;
};

type DocumentState = {
  fileId: number;
  content: string;
  version: number;
  baseVersion: number;
  history: DocumentHistoryEntry[];
  clients: Set<string>;
  pending: Map<number, ClientOperationPayload[]>;
};

const MAX_HISTORY = 200;

/** -------------------- Gateway -------------------- */

@WebSocketGateway({
  cors: { origin: '*' },
})
export class EditorGateway {
  @WebSocketServer()
  server: Server;

  private readonly documents = new Map<number, DocumentState>();
  private readonly clientFiles = new Map<string, number>();

  constructor(private readonly fileService: FileService) {}

  /**
   * Handle a client joining an editor room for a specific file.
   * Sends the current document state to the new client.
   */
  @SubscribeMessage('editor:join')
  async handleJoin(
    @MessageBody() payload: { fileId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const fileId = Number(payload?.fileId);
    if (!Number.isFinite(fileId)) {
      client.emit('editor:error', { fileId, message: 'A valid fileId is required to join.' });
      return;
    }

    try {
      const document = await this.ensureDocument(fileId);
      this.switchClientRoom(client, fileId);
      document.clients.add(client.id);

      client.emit('editor:ready', {
        fileId,
        version: document.version,
        content: document.content,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load file content.';
      client.emit('editor:error', { fileId, message });
    }
  }

  /**
   * Receive an operation from a client and apply it to the document.
   * Queues, transforms, or commits it depending on version alignment.
   */
  @SubscribeMessage('editor:operation')
  async handleOperation(
    @MessageBody() payload: ClientOperationPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const fileId = Number(payload?.fileId);
    if (!Number.isFinite(fileId)) {
      client.emit('editor:error', { fileId, message: 'Invalid file identifier supplied.' });
      return;
    }

    const document = await this.ensureDocument(fileId);
    const normalized = normalizeOperation(payload.components ?? []);
    const baseVersion = Number(payload.version);

    if (!Number.isFinite(baseVersion)) {
      client.emit('editor:error', { fileId, message: 'Operation version is required.' });
      return;
    }

    if (baseVersion > document.version) {
      this.queueOperation(document, { ...payload, components: normalized });
      return;
    }

    if (baseVersion < document.baseVersion) {
      client.emit('editor:resync', { fileId, version: document.version });
      return;
    }

    const applied = this.resolveAndCommit(document, {
      ...payload,
      components: normalized,
    });

    if (!applied) {
      client.emit('editor:resync', { fileId, version: document.version });
    }
  }

  /**
   * Handle client disconnection and clean up their associations.
   */
  handleDisconnect(client: Socket) {
    const fileId = this.clientFiles.get(client.id);
    if (fileId) {
      const document = this.documents.get(fileId);
      document?.clients.delete(client.id);
      if (document && document.clients.size === 0) {
        this.documents.delete(fileId);
      }
      this.clientFiles.delete(client.id);
      client.leave(this.getRoomName(fileId));
    }
  }

  /** -------------------- Internals -------------------- */

  /**
   * Move a client into the appropriate WebSocket room for a given file.
   */
  private switchClientRoom(client: Socket, fileId: number) {
    const previousFileId = this.clientFiles.get(client.id);
    if (previousFileId && previousFileId !== fileId) {
      client.leave(this.getRoomName(previousFileId));
      const previousDocument = this.documents.get(previousFileId);
      previousDocument?.clients.delete(client.id);
    }
    client.join(this.getRoomName(fileId));
    this.clientFiles.set(client.id, fileId);
  }

  /**
   * Retrieve or initialize a document's state from the database.
   */
  private async ensureDocument(fileId: number): Promise<DocumentState> {
    const existing = this.documents.get(fileId);
    if (existing) return existing;

    const file = await this.fileService.getFileById(fileId);
    const state: DocumentState = {
      fileId,
      content: file.content ?? '',
      version: 0,
      baseVersion: 0,
      history: [],
      clients: new Set<string>(),
      pending: new Map<number, ClientOperationPayload[]>(),
    };
    this.documents.set(fileId, state);
    return state;
  }

  /**
   * Queue an operation that arrived out of order for later application.
   */
  private queueOperation(document: DocumentState, operation: ClientOperationPayload) {
    const queue = document.pending.get(operation.version) ?? [];
    queue.push(operation);
    document.pending.set(operation.version, queue);
  }

  /**
   * Transform and apply a client operation to bring it in sync with document history.
   */
  private resolveAndCommit(document: DocumentState, operation: ClientOperationPayload) {
    if (operation.version < document.baseVersion) return false;

    let transformed = normalizeOperation(operation.components);

    for (let version = operation.version; version < document.version; version += 1) {
      const historyEntry = document.history[version - document.baseVersion];
      if (!historyEntry) return false;
      transformed = transformOperation(transformed, historyEntry.components);
    }

    return this.commitOperation(document, {
      ...operation,
      components: transformed,
    });
  }

  /**
   * Apply a validated operation to the document state and broadcast it to connected clients.
   */
  private commitOperation(document: DocumentState, operation: ClientOperationPayload) {
    let nextContent: string;
    try {
      nextContent = applyTextOperation(document.content, operation.components);
    } catch (error) {
      console.error('Failed to apply collaborative operation', error);
      return false;
    }

    document.content = nextContent;
    document.history.push({ version: document.version, components: operation.components });
    document.version += 1;

    if (document.history.length > MAX_HISTORY) {
      document.history.shift();
      document.baseVersion += 1;
    }

    // Persist asynchronously to the database
    void this.fileService.updateFile(document.fileId, { content: nextContent }).catch(() => {
      console.warn(`Failed to persist collaborative changes for file ${document.fileId}`);
    });

    // Broadcast applied operation to all connected clients
    this.server.to(this.getRoomName(document.fileId)).emit('editor:operation-applied', {
      fileId: document.fileId,
      version: document.version,
      components: operation.components,
      clientId: operation.clientId,
    });

    this.processQueuedOperations(document);
    return true;
  }

  /**
   * Process any queued operations that are now ready to apply.
   */
  private processQueuedOperations(document: DocumentState) {
    let progress = true;
    while (progress) {
      progress = false;
      for (const [version, queue] of document.pending) {
        if (!queue.length) {
          document.pending.delete(version);
          continue;
        }
        if (version > document.version) continue;

        const nextOperation = queue.shift()!;
        if (!queue.length) document.pending.delete(version);

        const committed = this.resolveAndCommit(document, nextOperation);
        if (!committed) document.pending.delete(version);

        progress = true;
        break;
      }
    }
  }

  /**
   * Generate the WebSocket room name for a given file.
   */
  private getRoomName(fileId: number) {
    return `file:${fileId}`;
  }
}
