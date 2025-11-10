/**
 * TerminalModule
 * ----------------
 * Enables real-time code execution through WebSocket-based terminals.
 * Registers the TerminalGateway, which runs code securely inside Docker containers.
 */

import { Module } from '@nestjs/common';
import { TerminalGateway } from './terminal.gateway';

@Module({
  providers: [TerminalGateway], // Provides live code execution over WebSocket
})
export class TerminalModule {}
