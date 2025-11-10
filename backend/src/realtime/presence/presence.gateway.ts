/**
 * PresenceGateway
 * ----------------
 * Handles real-time user presence tracking in collaborative sessions.
 * Keeps project members aware of who is currently active using WebSocket events.
 */

import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionService } from '../../session/session.service';

/** -------------------- Types -------------------- */

type PresenceJoinPayload = { sessionId: number };
type PresenceLeavePayload = { sessionId?: number };
type PresenceHeartbeatPayload = { sessionId: number };

/** -------------------- Gateway -------------------- */

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'presence',
})
export class PresenceGateway {
  @WebSocketServer()
  server: Server;

  private readonly clientSessions = new Map<string, { sessionId: number; projectId: number }>();

  constructor(private readonly sessionService: SessionService) {}

  /**
   * Handles client connection to a presence-tracking session.
   * Joins the WebSocket room for the related project and broadcasts updated presence.
   */
  @SubscribeMessage('presence:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: PresenceJoinPayload,
  ) {
    const sessionId = Number(payload?.sessionId);
    if (!Number.isFinite(sessionId)) {
      client.emit('presence:error', {
        message: 'A valid sessionId is required to join presence tracking.',
      });
      return;
    }

    const session = await this.sessionService.getSessionById(sessionId);
    if (!session || !session.project?.id) {
      client.emit('presence:error', {
        message: 'Session not found for presence tracking.',
      });
      return;
    }

    const projectId = session.project.id;
    const room = this.getRoomName(projectId);

    this.clientSessions.set(client.id, { sessionId, projectId });
    client.join(room);

    await this.sessionService.markSessionActivity(sessionId);
    await this.broadcastProjectPresence(projectId);
  }

  /**
   * Handles client disconnection by cleaning up session tracking data.
   */
  async handleDisconnect(client: Socket) {
    await this.cleanupClient(client);
  }

  /**
   * Handles explicit client leave requests.
   * Useful when a user closes a tab without disconnecting the socket.
   */
  @SubscribeMessage('presence:leave')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: PresenceLeavePayload,
  ) {
    await this.cleanupClient(client, payload?.sessionId);
  }

  /**
   * Heartbeat signal from clients to indicate active presence.
   * Updates session activity and rebroadcasts the presence list.
   */
  @SubscribeMessage('presence:heartbeat')
  async handleHeartbeat(
    @MessageBody() payload: PresenceHeartbeatPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const sessionId = Number(payload?.sessionId);
    if (!Number.isFinite(sessionId)) return;

    await this.sessionService.markSessionActivity(sessionId);
    const mapping = this.clientSessions.get(client.id);
    if (mapping?.projectId) {
      await this.broadcastProjectPresence(mapping.projectId);
    }
  }

  /* -------------------------------------------------------------
   * Internal Helpers
   * ------------------------------------------------------------- */

  /**
   * Removes client-session mappings and ends the associated session.
   */
  private async cleanupClient(client: Socket, overrideSessionId?: number) {
    const mapping = this.clientSessions.get(client.id);
    if (!mapping) return;

    this.clientSessions.delete(client.id);

    const sessionId = overrideSessionId ?? mapping.sessionId;
    const projectId = mapping.projectId;

    if (sessionId) {
      await this.sessionService.endSession(sessionId).catch(() => undefined);
    }

    await this.broadcastProjectPresence(projectId);
  }

  /**
   * Broadcasts the active sessions and users for a given project to all connected clients.
   */
  private async broadcastProjectPresence(projectId: number) {
    const sessions = await this.sessionService.getActiveSessionsByProject(projectId);

    this.server.to(this.getRoomName(projectId)).emit('presence:update', {
      projectId,
      sessions: sessions.map((session) => ({
        id: session.id,
        status: session.status,
        last_activity: session.last_activity,
        user: session.user
          ? {
              id: session.user.id,
              username: session.user.username,
              email: session.user.email,
              avatar_url: session.user.avatar_url,
            }
          : null,
      })),
    });
  }

  /**
   * Generates the WebSocket room name for a given project.
   */
  private getRoomName(projectId: number) {
    return `project:${projectId}`;
  }
}
