import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  MaxFileSizeValidator,
  NotFoundException,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { UserService } from './user.service';
import { RegisterUserDto, UpdateUserProfileDto } from './dto/user.dto';

const AVATAR_UPLOAD_DIR = join(process.cwd(), 'uploads', 'avatars');

if (!existsSync(AVATAR_UPLOAD_DIR)) {
  mkdirSync(AVATAR_UPLOAD_DIR, { recursive: true });
}

@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  // ---------------- GET ----------------
  @Get()
  async findAll() {
    const users = await this.service.getAllUsers();
    if (!users || users.length === 0)
      throw new NotFoundException('No users found.');
    return users;
  }

  @Get(':id')
  async findById(@Param('id') id: number) {
    const user = await this.service.getUserById(id);
    if (!user) throw new NotFoundException('User not found.');
    return user;
  }

  // ---------------- POST ----------------
  @Post('register')
  async register(@Body() dto: RegisterUserDto) {
    const { username, email, password } = dto;
    return await this.service.createUser(username, email, password);
  }

  // ---------------- PUT ----------------
  @Put(':id')
  async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserProfileDto,
  ) {
    const { avatar_url, bio } = dto;

    if (!avatar_url && !bio)
      throw new BadRequestException('Provide at least one field to update.');

    const updated = await this.service.updateProfile(id, avatar_url, bio);
    if (!updated) throw new NotFoundException('User not found.');
    return { message: 'Profile updated successfully', user: updated };
  }

  @Post(':id/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, AVATAR_UPLOAD_DIR),
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const extension = extname(file.originalname) || '.png';
          cb(null, `${uniqueSuffix}${extension}`);
        },
      }),
    }),
  )
  async uploadAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    const allowedMimeTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
      );
    }

    const relativePath = `/uploads/avatars/${file.filename}`;
    const updated = await this.service.updateProfile(id, relativePath, undefined);
    if (!updated) throw new NotFoundException('User not found.');
    return { message: 'Avatar updated successfully', user: updated };
  }

  // ---------------- DELETE ----------------
  @Delete(':id')
  async deleteUser(@Param('id') id: number) {
    const success = await this.service.deleteUser(id);
    if (!success) throw new NotFoundException('User not found.');
    return { message: 'User deleted successfully' };
  }
}
