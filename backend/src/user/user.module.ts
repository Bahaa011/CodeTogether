/**
 * UserModule
 * -----------
 * Handles user-related functionality including:
 * - Entity registration with TypeORM
 * - User controller and service setup
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // Registers User entity with the repository
  controllers: [UserController],               // Handles incoming HTTP requests for users
  providers: [UserService],                    // Contains user-related business logic
  exports: [UserService],                      // Makes the service available to other modules
})
export class UserModule {}
