import { Module } from '@nestjs/common';
import { EditorModule } from './editor/editor.module';
import { PresenceModule } from './presence/presence.module';
import { TerminalModule } from './terminal/terminal.module';

@Module({
  imports: [EditorModule, PresenceModule, TerminalModule],
})
export class RealtimeModule {}

