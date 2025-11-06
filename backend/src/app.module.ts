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
import { TerminalGateway } from './terminal/terminal.gateway';
import { EditorGateway } from './editor.gateway';
import { ProjectTag } from './project-tag/project-tag.entity';
import { ProjectTagModule } from './project-tag/project-tag.module';
import { Notification } from './notification/notification.entity';
import { NotificationModule } from './notification/notification.module';
import { Comment } from './comment/comment.entity';
import { CommentModule } from './comment/comment.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',          // change to your DB user
      password: 'postgres',              // change to your DB password
      database: 'codetogether',            // your database name
      entities: [User, Project, File, Collaborator, Session, Version, ProjectTag, Notification, Comment],
      synchronize: true,             // ⚠️ auto creates tables (good for dev)
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
  ],
  providers: [TerminalGateway, EditorGateway],
  controllers: [],
})
export class AppModule {}
