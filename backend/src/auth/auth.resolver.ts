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

  @Mutation(() => LoginResponse)
  async login(@Args('input') input: LoginInput) {
    return this.authService.login(input.email, input.password);
  }

  @Mutation(() => AuthSession)
  async verifyMfa(@Args('input') input: VerifyMfaInput) {
    return this.authService.verifyMfaCode(input.token, input.code);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => User, { name: 'authProfile' })
  async authProfile(@CurrentUser() user: { userId: number }) {
    return this.authService.getProfile(user.userId);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => User)
  async toggleMfa(
    @CurrentUser() user: { userId: number },
    @Args('input') input: ToggleMfaInput,
  ) {
    return this.authService.toggleMfa(user.userId, input.enabled);
  }

  @Mutation(() => ActionMessage)
  async requestPasswordReset(@Args('input') input: RequestPasswordResetInput) {
    const result = await this.authService.requestPasswordReset(input.email);
    if (!result) {
      throw new Error('User not found');
    }
    return result;
  }

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
