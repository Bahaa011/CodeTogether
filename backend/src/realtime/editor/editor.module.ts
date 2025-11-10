/**
 * EditorModule
 * --------------
 * Provides real-time collaborative editing functionality via WebSockets.
 * Integrates the FileModule to persist document content changes in the database.
 */

import { Module } from '@nestjs/common';
import { FileModule } from '../../file/file.module';
import { EditorGateway } from './editor.gateway';

@Module({
  imports: [FileModule],   // Allows file persistence and retrieval
  providers: [EditorGateway], // Registers the WebSocket gateway for real-time editing
})
export class EditorModule {}
