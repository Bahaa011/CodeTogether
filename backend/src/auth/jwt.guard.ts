/**
 * JwtAuthGuard
 * --------------
 * Protects routes by validating JWT access tokens.
 * Extends the default Passport `jwt` strategy for authentication.
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
