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

  async createUser(username: string, email: string, password: string) {
    const password_hash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ username, email, password_hash });
    return await this.userRepo.save(user);
  }

  async getUserByEmail(email: string) {
    return await this.userRepo.findOne({ where: { email } });
  }

  async getAllUsers() {
    return await this.userRepo.find();
  }

  async getUserById(id: number) {
    return await this.userRepo.findOne({ where: { id } });
  }

  async updateProfile(id: number, avatar_url?: string, bio?: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) return null;

    if (avatar_url !== undefined) user.avatar_url = avatar_url;
    if (bio !== undefined) user.bio = bio;
    return await this.userRepo.save(user);
  }

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

  async getUserByMfaToken(token: string) {
    if (!token) return null;
    return this.userRepo.findOne({ where: { mfa_pending_token: token } });
  }

  async clearMfaChallenge(id: number) {
    await this.userRepo.update(id, {
      mfa_code: null,
      mfa_code_expires_at: null,
      mfa_pending_token: null,
      mfa_pending_token_expires_at: null,
    });
  }

  async getUserByResetToken(token: string) {
    return this.userRepo.findOne({ where: { reset_token: token } });
  }

  async updateResetToken(email: string, token: string, expiry: Date) {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    user.reset_token = token;
    user.reset_token_expiry = expiry;
    return this.userRepo.save(user);
  }

  async updatePassword(userId: number, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return null;

    user.password_hash = await bcrypt.hash(newPassword, 10);
    user.reset_token = null;
    user.reset_token_expiry = null;
    return this.userRepo.save(user);
  }

  async deleteUser(id: number) {
    const result = await this.userRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
