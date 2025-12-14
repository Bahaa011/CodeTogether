/**
 * UserModule
 * -----------
 * Handles user-related functionality including:
 * - Entity registration with TypeORM
 * - User controller and service setup
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from './user.entity';
import { UserResolver } from './user.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // Registers User entity with the repository
  providers: [UserService, UserResolver], // Contains user-related business logic
  exports: [UserService], // Makes the service available to other modules
})
export class UserModule {}
