import { NotFoundException } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { FileService } from './file.service';
import {
  CreateFileInput,
  ProjectFileModel,
  FileUserInfo,
  UpdateFileInput,
} from './dto/file.dto';
import { File } from './file.entity';
import { User } from '../user/user.entity';

@Resolver(() => ProjectFileModel)
export class FileResolver {
  constructor(private readonly fileService: FileService) {}

  private mapUser(user?: User | null): FileUserInfo | undefined {
    if (!user) return undefined;
    return {
      id: user.id,
      username: user.username ?? null,
      email: user.email ?? null,
      avatar_url: user.avatar_url ?? null,
    };
  }

  private mapFile(file: File): ProjectFileModel {
    return {
      id: file.id,
      filename: file.filename,
      file_type: file.file_type,
      content: file.content ?? '',
      created_at: file.created_at,
      updated_at: file.updated_at,
      project_id: file.project?.id ?? null,
      uploader_id: file.uploader?.id ?? null,
      uploader: this.mapUser(file.uploader) ?? null,
    };
  }

  @Query(() => [ProjectFileModel])
  async files() {
    const data = await this.fileService.getAllFiles();
    return data.map((file) => this.mapFile(file));
  }

  @Query(() => ProjectFileModel)
  async file(@Args('id', { type: () => Int }) id: number) {
    const found = await this.fileService.getFileById(id);
    if (!found) throw new NotFoundException('File not found.');
    return this.mapFile(found);
  }

  @Query(() => [ProjectFileModel])
  async filesByProject(
    @Args('projectId', { type: () => Int }) projectId: number,
  ) {
    const data = await this.fileService.getFilesByProject(projectId);
    return data.map((file) => this.mapFile(file));
  }

  @Mutation(() => ProjectFileModel)
  async createFile(@Args('input') input: CreateFileInput) {
    const created = await this.fileService.createFile(
      input.filename,
      input.file_type,
      input.content,
      input.projectId,
      input.uploaderId,
    );
    return this.mapFile(created);
  }

  @Mutation(() => ProjectFileModel)
  async updateFile(
    @Args('id', { type: () => Int }) id: number,
    @Args('input') input: UpdateFileInput,
  ) {
    const updated = await this.fileService.updateFile(id, input);
    if (!updated) throw new NotFoundException('File not found.');
    return this.mapFile(updated);
  }

  @Mutation(() => Boolean)
  async deleteFile(@Args('id', { type: () => Int }) id: number) {
    return this.fileService.deleteFile(id);
  }
}
