import { Module } from '@nestjs/common';
import { FileModule } from '../../file/file.module';
import { EditorGateway } from './editor.gateway';

@Module({
  imports: [FileModule],
  providers: [EditorGateway],
})
export class EditorModule {}

