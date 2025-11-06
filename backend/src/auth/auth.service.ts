import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  // Validate user credentials
  async validateUser(email: string, password: string) {
    const user = await this.userService.getUserByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid email or password.');

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid email or password.');

    // Don’t return password hash
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  // Generate JWT for a user
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    if (user.mfa_enabled) {
      return await this.initiateMfaChallenge(user);
    }

    return this.issueSession(user);
  }

  async getProfile(userId: number) {
    const user = await this.userService.getUserById(userId);
    if (!user) throw new NotFoundException('User not found.');
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  async requestPasswordReset(email: string) {
    const user = await this.userService.getUserByEmail(email);
    if (!user) return null;

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    await this.userService.updateResetToken(email, token, expiry);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl.replace(/\/+$/, '')}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail', // can be smtp, sendgrid, etc.
      auth: {
        user: process.env.MAIL_USER || 'diaaghamrawi2@gmail.com',
        pass: process.env.MAIL_PASS || 'ohsx dvww ctlv hopa ',
      },
    });

    const mailOptions = {
      from: `"CodeTogether" <${process.env.MAIL_USER || 'diaaghamrawi2@gmail.com'}>`,
      to: user.email,
      subject: 'Reset your password',
      html: this.buildEmailTemplate({
        title: 'Reset your password',
        greeting: `Hey ${user.username},`,
        intro: 'You asked to reset the password for your CodeTogether account.',
        actionLabel: 'Reset Password',
        actionUrl: resetLink,
        footerLines: [
          'This link expires in 15 minutes for your security.',
          "If you didn't request this, you can safely ignore this email.",
        ],
      }),
    };

    try {
      await transporter.sendMail(mailOptions);
      return { message: 'Password reset email sent successfully' };
    } catch (err) {
      console.error('❌ Error sending email:', err);
      // In dev, still return the link for testing
      return { message: 'Email sending failed, showing reset link instead', resetLink };
    }
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userService.getUserByResetToken(token);
    if (!user) return null;
    if (!user.reset_token_expiry || user.reset_token_expiry < new Date()) return false;

    return this.userService.updatePassword(user.id, newPassword);
  }

  async toggleMfa(userId: number, enabled: boolean) {
    const updated = await this.userService.setMfaStatus(userId, enabled);
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    const { password_hash, ...safeUser } = updated;
    return safeUser;
  }

  async verifyMfaCode(token: string, code: string) {
    if (!token || !code) {
      throw new BadRequestException('Token and code are required.');
    }

    const user = await this.userService.getUserByMfaToken(token);
    if (!user || !user.mfa_enabled) {
      throw new UnauthorizedException('Invalid or expired verification token.');
    }

    if (
      !user.mfa_pending_token_expires_at ||
      user.mfa_pending_token_expires_at < new Date()
    ) {
      await this.userService.clearMfaChallenge(user.id);
      throw new UnauthorizedException('Verification code expired. Please sign in again.');
    }

    if (!user.mfa_code) {
      throw new UnauthorizedException('No verification code present.');
    }

    const isMatch = await bcrypt.compare(code, user.mfa_code);
    if (!isMatch) {
      throw new UnauthorizedException('Incorrect verification code.');
    }

    await this.userService.clearMfaChallenge(user.id);
    return this.issueSession(user);
  }

  private async initiateMfaChallenge(user: any) {
    const otp = this.generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.userService.storeMfaChallenge(user.id, hashedOtp, token, expiresAt);
    await this.sendOtpEmail(user.email, user.username, otp);

    return {
      requires_mfa: true,
      mfaToken: token,
      message: 'We sent a 6-digit code to your email. Enter it to finish signing in.',
    };
  }

  private issueSession(user: any) {
    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);
    const { password_hash, ...safeUser } = user;
    return { access_token: token, user: safeUser };
  }

  private generateOtp() {
    const code = Math.floor(100000 + Math.random() * 900000);
    return String(code);
  }

  private async sendOtpEmail(to: string, username: string, code: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER || 'diaaghamrawi2@gmail.com',
        pass: process.env.MAIL_PASS || 'ohsx dvww ctlv hopa ',
      },
    });

    const mailOptions = {
      from: `"CodeTogether" <${process.env.MAIL_USER || 'diaaghamrawi2@gmail.com'}>`,
      to,
      subject: 'Your CodeTogether verification code',
      html: this.buildEmailTemplate({
        title: "Verify it's you",
        greeting: `Hi ${username || 'there'},`,
        intro: 'Enter this 6-digit code to finish signing in to CodeTogether.',
        highlightLabel: 'Your code',
        highlightValue: code,
        footerLines: [
          'This code expires in 5 minutes.',
          "If you didn't try to sign in, you can ignore this email.",
        ],
      }),
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send MFA email:', error);
      throw new BadRequestException('Unable to send verification code. Try again later.');
    }
  }

  private buildEmailTemplate({
    title,
    greeting,
    intro,
    actionLabel,
    actionUrl,
    highlightLabel,
    highlightValue,
    footerLines = [],
  }: {
    title: string;
    greeting: string;
    intro: string;
    actionLabel?: string;
    actionUrl?: string;
    highlightLabel?: string;
    highlightValue?: string;
    footerLines?: string[];
  }) {
    const buttonHtml =
      actionLabel && actionUrl
        ? `<a href="${actionUrl}" style="display:inline-block;padding:0.85rem 1.5rem;border-radius:999px;background:#22d3ee;color:#04121f;font-weight:600;text-decoration:none;">${actionLabel}</a>`
        : '';

    const highlightHtml =
      highlightLabel && highlightValue
        ? `<div style="margin-top:1rem;padding:1rem 1.25rem;border-radius:12px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.35);text-align:center;">
            <p style="margin:0 0 0.35rem;font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;color:#86efac;">${highlightLabel}</p>
            <div style="font-size:2rem;font-weight:700;letter-spacing:0.3rem;color:#ffffff;">${highlightValue}</div>
          </div>`
        : '';

    const footerHtml = footerLines
      .map(
        (line) =>
          `<p style="margin:0.35rem 0 0;color:rgba(226,232,240,0.7);font-size:0.85rem;">${line}</p>`,
      )
      .join('');

    return `
      <div style="background:#0b1220;padding:32px 0;font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width:520px;margin:0 auto;background:#111827;border:1px solid rgba(148,163,184,0.2);border-radius:18px;padding:32px;">
          <div style="text-align:center;margin-bottom:1.5rem;">
            <p style="margin:0;font-size:0.85rem;letter-spacing:0.2em;text-transform:uppercase;color:#38bdf8;">CodeTogether</p>
            <h1 style="margin:0.25rem 0 0;font-size:1.5rem;color:#f1f5f9;">${title}</h1>
          </div>
          <p style="margin:0 0 0.5rem;color:#e2e8f0;">${greeting}</p>
          <p style="margin:0 0 1.25rem;color:#cbd5f5;line-height:1.6;">${intro}</p>
          ${buttonHtml}
          ${highlightHtml}
          ${footerHtml ? `<div style="margin-top:1.5rem;">${footerHtml}</div>` : ''}
          <p style="margin:1.75rem 0 0;color:rgba(226,232,240,0.6);font-size:0.85rem;">- The CodeTogether Team</p>
        </div>
      </div>
    `;
  }
}
