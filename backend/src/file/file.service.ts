/**
 * FileService
 * ------------
 * Handles the business logic for managing project files.
 * Supports file creation, retrieval, updating, and deletion operations.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './file.entity';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepo: Repository<File>,
  ) {}

  /**
   * Create a new file within a project.
   */
  async createFile(
    filename: string,
    file_type: string,
    content: string | undefined,
    projectId: number,
    uploaderId: number,
  ) {
    const file = this.fileRepo.create({
      filename: filename.trim(),
      file_type,
      content: content ?? '',
      project: { id: Number(projectId) },
      uploader: { id: Number(uploaderId) },
    });
    return await this.fileRepo.save(file);
  }

  /**
   * Retrieve all files with their associated project and uploader.
   */
  async getAllFiles() {
    return await this.fileRepo.find({ relations: ['project', 'uploader'] });
  }

  /**
   * Retrieve a single file by its ID.
   * Throws a 404 error if not found.
   */
  async getFileById(id: number) {
    const file = await this.fileRepo.findOne({
      where: { id: Number(id) },
      relations: ['project', 'uploader'],
    });
    if (!file) throw new NotFoundException('File not found.');
    return file;
  }

  /**
   * Retrieve all files that belong to a specific project.
   */
  async getFilesByProject(projectId: number) {
    return await this.fileRepo.find({
      where: { project: { id: Number(projectId) } },
      relations: ['project', 'uploader'],
    });
  }

  /**
   * Update file details or content.
   */
  async updateFile(
    id: number,
    data: Partial<Pick<File, 'filename' | 'file_type' | 'content'>>,
  ) {
    const file = await this.getFileById(Number(id));

    if (typeof data.filename === 'string') file.filename = data.filename.trim();
    if (typeof data.file_type === 'string') file.file_type = data.file_type;
    if (typeof data.content === 'string') file.content = data.content;

    return await this.fileRepo.save(file);
  }

  /**
   * Delete a file by its ID.
   * Returns true if deletion was successful.
   */
  async deleteFile(id: number): Promise<boolean> {
    const result = await this.fileRepo.delete(Number(id));
    return (result.affected ?? 0) > 0;
  }
}
