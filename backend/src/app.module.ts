/**
 * @file app.module.ts
 * @description Root application module for the CodeTogether backend.
 *
 * This file configures TypeORM, environment variables, and imports all feature modules
 * such as User, Project, File, Collaborator, Auth, and others.
 */

import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';

// ✅ Feature modules
import { UserModule } from './user/user.module';
import { ProjectModule } from './project/project.module';
import { FileModule } from './file/file.module';
import { CollaboratorModule } from './collaborator/collaborator.module';
import { AuthModule } from './auth/auth.module';
import { SessionModule } from './session/session.module';
import { VersionModule } from './version/version.module';
import { ProjectTagModule } from './project-tag/project-tag.module';
import { NotificationModule } from './notification/notification.module';
import { RealtimeModule } from './realtime/realtime.module';

// ✅ Entities (Database Models)
import { User } from './user/user.entity';
import { Project } from './project/project.entity';
import { File } from './file/file.entity';
import { Collaborator } from './collaborator/collaborator.entity';
import { Session } from './session/session.entity';
import { Version } from './version/version.entity';
import { ProjectTag } from './project-tag/project-tag.entity';
import { Notification } from './notification/notification.entity';

/**
 * Read environment variables and set default values for DB configuration.
 */
const dbPort = Number(process.env.DATABASE_PORT ?? 5432);

/**
 * Determine whether TypeORM should auto-synchronize schema with entities.
 * This is safe for development, but should be disabled in production.
 */
const shouldSynchronize =
  process.env.TYPEORM_SYNCHRONIZE === undefined
    ? true
    : process.env.TYPEORM_SYNCHRONIZE === 'true';

/**
 * Root application module.
 *
 * Responsibilities:
 * - Establishes database connection via TypeORM.
 * - Registers all feature modules.
 * - Provides global configuration for the backend.
 */
@Module({
  imports: [
    /**
     * GraphQL Configuration
     *
     * Enables code-first schema generation and the Apollo driver.
     */
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src', 'schema.gql'),
      sortSchema: true,
      playground: true,
      context: ({ req }) => ({ req }),
      resolvers: { Upload: GraphQLUpload },
    }),

    /**
     * TypeORM Database Configuration.
     *
     * Connects to PostgreSQL using environment variables.
     * Automatically loads all entity classes.
     */
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST ?? 'localhost',
      port: Number.isNaN(dbPort) ? 5432 : dbPort,
      username: process.env.DATABASE_USER ?? 'postgres',
      password: process.env.DATABASE_PASS ?? 'postgres',
      database: process.env.DATABASE_NAME ?? 'codetogether',
      entities: [
        User,
        Project,
        File,
        Collaborator,
        Session,
        Version,
        ProjectTag,
        Notification,
      ],
      synchronize: shouldSynchronize, // Automatically syncs entities to DB schema
    }),

    // ✅ Import all feature modules (business logic layers)
    UserModule,
    ProjectModule,
    FileModule,
    CollaboratorModule,
    AuthModule,
    SessionModule,
    VersionModule,
    ProjectTagModule,
    NotificationModule,
    RealtimeModule,
  ],
  providers: [], // Global providers (if any)
  controllers: [], // Global controllers (none here)
})
export class AppModule {}
