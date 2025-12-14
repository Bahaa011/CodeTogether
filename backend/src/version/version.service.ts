/**
 * VersionService
 * ---------------
 * Handles version management for project files.
 * Supports creating, retrieving, and reverting file versions.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Version } from './version.entity';
import { File } from '../file/file.entity';

@Injectable()
export class VersionService {
  constructor(
    @InjectRepository(Version)
    private readonly versionRepo: Repository<Version>,
    @InjectRepository(File)
    private readonly fileRepo: Repository<File>,
  ) {}

  /**
   * Create a new version of a file.
   * Automatically increments the version number based on the latest version.
   */
  async createVersion(
    fileId: number,
    userId: number | null | undefined,
    sessionId: number | null | undefined,
    content: string,
    label?: string | null,
  ) {
    const normalizedFileId = Number(fileId);
    const normalizedUserId = typeof userId === 'number' ? Number(userId) : null;
    const normalizedSessionId =
      typeof sessionId === 'number' ? Number(sessionId) : null;

    const lastVersion = await this.versionRepo.findOne({
      where: { file: { id: normalizedFileId } },
      order: { version_number: 'DESC' },
    });

    const nextVersion = lastVersion ? lastVersion.version_number + 1 : 1;

    const version = this.versionRepo.create({
      file: { id: normalizedFileId },
      content,
      version_number: nextVersion,
      label: label?.trim() ? label.trim() : null,
      ...(normalizedUserId ? { user: { id: normalizedUserId } } : {}),
      ...(normalizedSessionId ? { session: { id: normalizedSessionId } } : {}),
    });

    return await this.versionRepo.save(version);
  }

  /**
   * Get all versions for a specific file (most recent first).
   */
  async getFileVersions(fileId: number) {
    return await this.versionRepo.find({
      where: { file: { id: Number(fileId) } },
      order: { version_number: 'DESC' },
      relations: ['user', 'session', 'file'],
    });
  }

  /**
   * Get the latest version of a given file.
   */
  async getLatestVersion(fileId: number) {
    return await this.versionRepo.findOne({
      where: { file: { id: Number(fileId) } },
      order: { version_number: 'DESC' },
    });
  }

  /**
   * Get a version by its unique ID.
   * Includes related file, user, and session data.
   */
  async getVersionById(id: number) {
    return await this.versionRepo.findOne({
      where: { id: Number(id) },
      relations: ['file', 'user', 'session'],
    });
  }

  /**
   * Revert a file to the content of a specified version.
   * Throws a NotFoundException if version or file does not exist.
   */
  async revertVersion(versionId: number) {
    const version = await this.versionRepo.findOne({
      where: { id: Number(versionId) },
      relations: ['file'],
    });

    if (!version || !version.file?.id) {
      throw new NotFoundException('Backup not found.');
    }

    const file = await this.fileRepo.findOne({
      where: { id: version.file.id },
    });

    if (!file) {
      throw new NotFoundException('File not found for this backup.');
    }

    file.content = version.content;
    await this.fileRepo.save(file);

    return file;
  }
}
