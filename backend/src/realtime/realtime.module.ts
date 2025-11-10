/**
 * RealtimeModule
 * ----------------
 * Central module for all real-time collaboration features.
 * Combines the Editor, Presence, and Terminal gateways into one cohesive system.
 */

import { Module } from '@nestjs/common';
import { EditorModule } from './editor/editor.module';
import { PresenceModule } from './presence/presence.module';
import { TerminalModule } from './terminal/terminal.module';

@Module({
  imports: [
    EditorModule,   // Handles live collaborative code editing (Operational Transform)
    PresenceModule, // Tracks active users and sessions per project
    TerminalModule, // Enables real-time code execution in isolated Docker containers
  ],
})
export class RealtimeModule {}
