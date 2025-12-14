/**
 * VersionResolver
 * ---------------
 * Exposes version history queries/mutations and maps entities to GraphQL models.
 */
import { NotFoundException } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { VersionService } from './version.service';
import {
  CreateVersionInput,
  VersionFileInfo,
  VersionFileModel,
  VersionModel,
  VersionSessionInfo,
  VersionUserInfo,
} from './dto/version.dto';
import { Version } from './version.entity';
import { User } from '../user/user.entity';
import { Session } from '../session/session.entity';
import { File } from '../file/file.entity';

@Resolver(() => VersionModel)
export class VersionResolver {
  constructor(private readonly versionService: VersionService) {}

  private mapUser(user?: User | null): VersionUserInfo | undefined {
    if (!user) return undefined;
    return {
      id: user.id,
      username: user.username ?? null,
      email: user.email ?? null,
    };
  }

  private mapSession(session?: Session | null): VersionSessionInfo | undefined {
    if (!session) return undefined;
    return {
      id: session.id,
    };
  }

  private mapFile(file?: File | null): VersionFileInfo | undefined {
    if (!file) return undefined;
    return {
      id: file.id,
      filename: file.filename ?? '',
      file_type: file.file_type ?? '',
    };
  }

  private mapFullFile(file: File): VersionFileModel {
    return {
      id: file.id,
      filename: file.filename ?? '',
      file_type: file.file_type ?? '',
      content: file.content ?? '',
      updated_at: file.updated_at ?? null,
    };
  }

  private mapVersion(version: Version): VersionModel {
    return {
      id: version.id,
      version_number: version.version_number,
      content: version.content,
      label: version.label ?? null,
      created_at: version.created_at,
      file: this.mapFile(version.file) ?? null,
      user: this.mapUser(version.user) ?? null,
      session: this.mapSession(version.session) ?? null,
    };
  }

  /** Fetch backups for a given file id. */
  @Query(() => [VersionModel])
  async versionsByFile(@Args('fileId', { type: () => Int }) fileId: number) {
    const versions = await this.versionService.getFileVersions(fileId);
    return versions.map((version) => this.mapVersion(version));
  }

  /** Fetch a specific version by id. */
  @Query(() => VersionModel)
  async version(@Args('id', { type: () => Int }) id: number) {
    const found = await this.versionService.getVersionById(id);
    if (!found) throw new NotFoundException('Version not found.');
    return this.mapVersion(found);
  }

  /** Create a new version backup for a file. */
  @Mutation(() => VersionModel)
  async createVersion(@Args('input') input: CreateVersionInput) {
    const created = await this.versionService.createVersion(
      input.fileId,
      input.userId,
      input.sessionId,
      input.content,
      input.label,
    );
    const withRelations = await this.versionService.getVersionById(created.id);
    if (!withRelations) throw new NotFoundException('Version not found.');
    return this.mapVersion(withRelations);
  }

  /** Revert a file to the specified version. */
  @Mutation(() => VersionFileModel)
  async revertVersion(@Args('id', { type: () => Int }) id: number) {
    const file = await this.versionService.revertVersion(id);
    return this.mapFullFile(file);
  }
}
