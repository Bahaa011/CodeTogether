/**
 * AuthResolver
 * ------------
 * Handles authentication-related GraphQL mutations/queries and delegates to AuthService.
 */
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from '../user/user.entity';
import { AuthService } from './auth.service';
import {
  ActionMessage,
  AuthSession,
  LoginInput,
  LoginResponse,
  RequestPasswordResetInput,
  ResetPasswordInput,
  ToggleMfaInput,
  VerifyMfaInput,
} from './dto/auth.dto';
import { GqlAuthGuard } from './gql-auth.guard';
import { CurrentUser } from './current-user.decorator';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  /** Authenticate with email/password and issue session or MFA challenge. */
  @Mutation(() => LoginResponse)
  async login(@Args('input') input: LoginInput) {
    return this.authService.login(input.email, input.password);
  }

  /** Verify MFA code and complete login. */
  @Mutation(() => AuthSession)
  async verifyMfa(@Args('input') input: VerifyMfaInput) {
    return this.authService.verifyMfaCode(input.token, input.code);
  }

  /** Return the authenticated user's profile. */
  @UseGuards(GqlAuthGuard)
  @Query(() => User, { name: 'authProfile' })
  async authProfile(@CurrentUser() user: { userId: number }) {
    return this.authService.getProfile(user.userId);
  }

  /** Enable/disable MFA for the authenticated user. */
  @UseGuards(GqlAuthGuard)
  @Mutation(() => User)
  async toggleMfa(
    @CurrentUser() user: { userId: number },
    @Args('input') input: ToggleMfaInput,
  ) {
    return this.authService.toggleMfa(user.userId, input.enabled);
  }

  /** Request a password reset email. */
  @Mutation(() => ActionMessage)
  async requestPasswordReset(@Args('input') input: RequestPasswordResetInput) {
    const result = await this.authService.requestPasswordReset(input.email);
    if (!result) {
      throw new Error('User not found');
    }
    return result;
  }

  /** Reset password using a token from email link. */
  @Mutation(() => ActionMessage)
  async resetPassword(@Args('input') input: ResetPasswordInput) {
    const result = await this.authService.resetPassword(
      input.token,
      input.newPassword,
    );

    if (result === null) {
      throw new Error('Invalid token');
    }
    if (result === false) {
      throw new Error('Token expired');
    }

    return { message: 'Password reset successful' };
  }
}
