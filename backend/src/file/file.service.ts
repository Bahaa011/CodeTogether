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

  async getAllFiles() {
    return await this.fileRepo.find({ relations: ['project', 'uploader'] });
  }

  async getFileById(id: number) {
    const file = await this.fileRepo.findOne({
      where: { id: Number(id) },
      relations: ['project', 'uploader'],
    });
    if (!file) throw new NotFoundException('File not found.');
    return file;
  }

  async getFilesByProject(projectId: number) {
    return await this.fileRepo.find({
      where: { project: { id: Number(projectId) } },
      relations: ['uploader'],
    });
  }

  async updateFile(
    id: number,
    data: Partial<Pick<File, 'filename' | 'file_type' | 'content'>>,
  ) {
    const file = await this.getFileById(Number(id));
    if (typeof data.filename === 'string') {
      file.filename = data.filename.trim();
    }
    if (typeof data.file_type === 'string') {
      file.file_type = data.file_type;
    }
    if (typeof data.content === 'string') {
      file.content = data.content;
    }
    return await this.fileRepo.save(file);
  }

  async deleteFile(id: number): Promise<boolean> {
    const result = await this.fileRepo.delete(Number(id));
    return (result.affected ?? 0) > 0;
  }
}
