import { Module } from '@nestjs/common';
import { SessionModule } from '../../session/session.module';
import { PresenceGateway } from './presence.gateway';

@Module({
  imports: [SessionModule],
  providers: [PresenceGateway],
})
export class PresenceModule {}

