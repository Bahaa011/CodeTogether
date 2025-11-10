/**
 * UserService
 * ------------
 * Handles all user-related database operations and business logic:
 * - Account creation and retrieval
 * - Profile updates
 * - Password resets
 * - Multi-Factor Authentication (MFA) handling
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Create a new user with a hashed password.
   */
  async createUser(username: string, email: string, password: string) {
    const password_hash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ username, email, password_hash });
    return await this.userRepo.save(user);
  }

  /**
   * Retrieve a user by their email.
   */
  async getUserByEmail(email: string) {
    return await this.userRepo.findOne({ where: { email } });
  }

  /**
   * Retrieve all users in the system.
   */
  async getAllUsers() {
    return await this.userRepo.find();
  }

  /**
   * Retrieve a user by their unique ID.
   */
  async getUserById(id: number) {
    return await this.userRepo.findOne({ where: { id } });
  }

  /**
   * Update a user's profile (avatar or bio).
   * Returns the updated user or null if not found.
   */
  async updateProfile(id: number, avatar_url?: string, bio?: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) return null;

    if (avatar_url !== undefined) user.avatar_url = avatar_url;
    if (bio !== undefined) user.bio = bio;
    return await this.userRepo.save(user);
  }

  /**
   * Enable or disable multi-factor authentication (MFA) for a user.
   * Clears any existing MFA data when toggled.
   */
  async setMfaStatus(id: number, enabled: boolean) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) return null;

    user.mfa_enabled = enabled;
    user.mfa_code = null;
    user.mfa_code_expires_at = null;
    user.mfa_pending_token = null;
    user.mfa_pending_token_expires_at = null;

    return this.userRepo.save(user);
  }

  /**
   * Store an MFA challenge (hashed code + pending token).
   */
  async storeMfaChallenge(
    id: number,
    hashedCode: string,
    token: string,
    expiresAt: Date,
  ) {
    await this.userRepo.update(id, {
      mfa_code: hashedCode,
      mfa_code_expires_at: expiresAt,
      mfa_pending_token: token,
      mfa_pending_token_expires_at: expiresAt,
    });
  }

  /**
   * Find a user by their pending MFA token.
   */
  async getUserByMfaToken(token: string) {
    if (!token) return null;
    return this.userRepo.findOne({ where: { mfa_pending_token: token } });
  }

  /**
   * Clear an MFA challenge after successful verification or expiration.
   */
  async clearMfaChallenge(id: number) {
    await this.userRepo.update(id, {
      mfa_code: null,
      mfa_code_expires_at: null,
      mfa_pending_token: null,
      mfa_pending_token_expires_at: null,
    });
  }

  /**
   * Find a user by their password reset token.
   */
  async getUserByResetToken(token: string) {
    return this.userRepo.findOne({ where: { reset_token: token } });
  }

  /**
   * Update password reset token and expiry for a user by email.
   */
  async updateResetToken(email: string, token: string, expiry: Date) {
    const user = await this.getUserByEmail(email);
    if (!user) return null;

    user.reset_token = token;
    user.reset_token_expiry = expiry;
    return this.userRepo.save(user);
  }

  /**
   * Update a user's password and clear their reset token.
   */
  async updatePassword(userId: number, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return null;

    user.password_hash = await bcrypt.hash(newPassword, 10);
    user.reset_token = null;
    user.reset_token_expiry = null;
    return this.userRepo.save(user);
  }

  /**
   * Delete a user by ID.
   * Returns true if deletion was successful.
   */
  async deleteUser(id: number) {
    const result = await this.userRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
