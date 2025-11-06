import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { LoginDto } from './dto/login.dto';
import { ToggleMfaDto } from './dto/toggle-mfa.dto';
import { VerifyMfaDto } from './dto/verify-mfa.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ---------------- LOGIN ----------------
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const { email, password } = dto;

    if (!email || !password)
      throw new BadRequestException('Email and password are required.');

    return await this.authService.login(email, password);
  }

  // ---------------- PROFILE (Protected) ----------------
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return await this.authService.getProfile(req.user.userId);
  }

  @Post('forgot-password')
  async requestReset(@Body() body: { email: string }) {
    const result = await this.authService.requestPasswordReset(body.email);
    if (!result) throw new BadRequestException('User not found');
    return { message: 'Reset link sent successfully' };
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    const result = await this.authService.resetPassword(body.token, body.newPassword);
    if (result === null) throw new BadRequestException('Invalid token');
    if (result === false) throw new BadRequestException('Token expired');
    return { message: 'Password reset successful' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/toggle')
  async toggleMfa(@Request() req, @Body() dto: ToggleMfaDto) {
    return this.authService.toggleMfa(req.user.userId, dto.enabled);
  }

  @Post('mfa/verify')
  async verifyMfa(@Body() dto: VerifyMfaDto) {
    return this.authService.verifyMfaCode(dto.token, dto.code);
  }
}
