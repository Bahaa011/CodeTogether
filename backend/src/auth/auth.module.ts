/**
 * AuthModule
 * ------------
 * Provides authentication and authorization functionality for the application.
 * Handles user login, JWT strategy, and multi-factor authentication (MFA) integration.
 */

import 'dotenv/config';
import { Module } from '@nestjs/common';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './jwt.strategy';
import { AuthResolver } from './auth.resolver';
import { GqlAuthGuard } from './gql-auth.guard';

@Module({
  imports: [
    UserModule, // Provides access to user data
    PassportModule, // Enables Passport authentication support
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-jwt-secret', // JWT secret for signing tokens
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ??
          '1d') as JwtSignOptions['expiresIn'],
      },
    }),
  ],
  providers: [AuthService, JwtStrategy, AuthResolver, GqlAuthGuard], // Core authentication logic, GraphQL resolver, and guards
  exports: [AuthService], // Makes AuthService available to other modules
})
export class AuthModule {}
