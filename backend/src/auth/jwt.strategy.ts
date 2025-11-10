/**
 * JwtStrategy
 * -------------
 * Defines the JWT authentication strategy for validating access tokens.
 * Extracts the token from the Authorization header and verifies its signature
 * using the configured secret key.
 */

import 'dotenv/config';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extracts JWT from Bearer token
      ignoreExpiration: false,                                  // Rejects expired tokens
      secretOrKey: process.env.JWT_SECRET ?? 'dev-jwt-secret',  // Uses environment or default secret
    });
  }

  /**
   * Validate the decoded JWT payload and attach it to the request context.
   */
  async validate(payload: any) {
    // Payload contains user identity: { sub: user.id, email: user.email }
    return { userId: payload.sub, email: payload.email };
  }
}
