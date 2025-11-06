import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectTag } from './project-tag.entity';
import { ProjectTagService } from './project-tag.service';
import { ProjectTagController } from './project-tag.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectTag])],
  controllers: [ProjectTagController],
  providers: [ProjectTagService],
  exports: [ProjectTagService],
})
export class ProjectTagModule {}
