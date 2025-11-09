import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';
import { FileModule } from './file/file.module';
import { CollaboratorModule } from './collaborator/collaborator.module';
import { User } from './user/user.entity';
import { Project } from './project/project.entity';
import { File } from './file/file.entity';
import { Collaborator } from './collaborator/collaborator.entity';
import { Session } from './session/session.entity';
import { AuthModule } from './auth/auth.module';
import { SessionModule } from './session/session.module';
import { VersionModule } from './version/version.module';
import { Version } from './version/version.entity';
import { ProjectTag } from './project-tag/project-tag.entity';
import { ProjectTagModule } from './project-tag/project-tag.module';
import { Notification } from './notification/notification.entity';
import { NotificationModule } from './notification/notification.module';
import { Comment } from './comment/comment.entity';
import { CommentModule } from './comment/comment.module';
import { RealtimeModule } from './realtime/realtime.module';

const dbPort = Number(process.env.DATABASE_PORT ?? 5432);
const shouldSynchronize =
  process.env.TYPEORM_SYNCHRONIZE === undefined
    ? true
    : process.env.TYPEORM_SYNCHRONIZE === 'true';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST ?? 'localhost',
      port: Number.isNaN(dbPort) ? 5432 : dbPort,
      username: process.env.DATABASE_USER ?? 'postgres',
      password: process.env.DATABASE_PASS ?? 'postgres',
      database: process.env.DATABASE_NAME ?? 'codetogether',
      entities: [User, Project, File, Collaborator, Session, Version, ProjectTag, Notification, Comment],
      synchronize: shouldSynchronize,
    }),
    UserModule,
    ProjectModule,
    FileModule,
    CollaboratorModule,
    AuthModule,
    SessionModule,
    VersionModule,
    ProjectTagModule,
    NotificationModule,
    CommentModule,
    RealtimeModule,
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}
