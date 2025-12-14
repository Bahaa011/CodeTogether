import {
  BadRequestException,
  NotFoundException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { User } from './user.entity';
import { UserService } from './user.service';
import { RegisterUserDto, UpdateUserProfileDto } from './dto/user.dto';

type FileUpload = {
  filename: string;
  mimetype: string;
  encoding: string;
  createReadStream(): NodeJS.ReadableStream;
};

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  private static getAvatarDir(): string {
    const dir = join(process.cwd(), 'uploads', 'avatars');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  private static sanitizeFileName(name: string) {
    return name.replace(/[^a-zA-Z0-9.\-_]/g, '');
  }

  @Query(() => [User], { name: 'users' })
  async getUsers() {
    const users = await this.userService.getAllUsers();
    if (!users || users.length === 0) {
      throw new NotFoundException('No users found.');
    }

    return users;
  }

  @Query(() => User, { name: 'user' })
  async getUser(
    @Args('id', { type: () => Int })
    id: number,
  ) {
    const user = await this.userService.getUserById(id);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  @UsePipes(new ValidationPipe())
  @Mutation(() => User)
  async registerUser(@Args('input') input: RegisterUserDto) {
    return this.userService.createUser(
      input.username,
      input.email,
      input.password,
    );
  }

  @UsePipes(new ValidationPipe({ skipMissingProperties: true }))
  @Mutation(() => User)
  async updateUserProfile(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateUserProfileDto,
  ) {
    const { avatar_url, bio } = input;

    if (avatar_url === undefined && bio === undefined) {
      throw new BadRequestException('Provide at least one field to update.');
    }

    const updated = await this.userService.updateProfile(id, avatar_url, bio);

    if (!updated) {
      throw new NotFoundException('User not found.');
    }

    return updated;
  }

  @Mutation(() => Boolean)
  async deleteUser(@Args('id', { type: () => Int }) id: number) {
    const success = await this.userService.deleteUser(id);
    if (!success) {
      throw new NotFoundException('User not found.');
    }
    return true;
  }

  @Mutation(() => User)
  async uploadUserAvatar(
    @Args('userId', { type: () => Int }) userId: number,
    @Args({ name: 'file', type: () => GraphQLUpload })
    file: Promise<FileUpload>,
  ) {
    const { createReadStream, filename } = await file;
    const sanitized = UserResolver.sanitizeFileName(filename);
    const targetName = `${Date.now()}-${sanitized || 'avatar'}`;
    const avatarDir = UserResolver.getAvatarDir();
    const filePath = join(avatarDir, targetName);

    await new Promise<void>((resolve, reject) => {
      createReadStream()
        .pipe(createWriteStream(filePath))
        .on('finish', () => resolve())
        .on('error', (error) => reject(error));
    });

    const avatarUrl = `/uploads/avatars/${targetName}`;
    const updated = await this.userService.updateProfile(
      userId,
      avatarUrl,
      undefined,
    );
    if (!updated) {
      throw new NotFoundException('User not found.');
    }
    return updated;
  }
}
