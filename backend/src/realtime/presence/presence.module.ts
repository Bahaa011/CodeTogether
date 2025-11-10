/**
 * PresenceModule
 * ----------------
 * Provides real-time presence tracking for collaborative projects.
 * Integrates with the SessionModule to monitor active user sessions.
 */

import { Module } from '@nestjs/common';
import { SessionModule } from '../../session/session.module';
import { PresenceGateway } from './presence.gateway';

@Module({
  imports: [SessionModule],  // Enables session management and activity tracking
  providers: [PresenceGateway], // Registers the WebSocket gateway for presence updates
})
export class PresenceModule {}
