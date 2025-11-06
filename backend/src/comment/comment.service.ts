import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
  ) {}

  async createComment(
    content: string,
    authorId: number,
    projectId: number,
    fileId?: number,
    versionId?: number,
  ) {
    const comment = this.commentRepo.create({
      content,
      author: { id: Number(authorId) },
      project: { id: Number(projectId) },
      file: fileId ? { id: Number(fileId) } : null,
      version: versionId ? { id: Number(versionId) } : null,
    });
    return await this.commentRepo.save(comment);
  }

  async getCommentById(id: number) {
    const comment = await this.commentRepo.findOne({
      where: { id: Number(id) },
      relations: ['author', 'project', 'file', 'version'],
    });
    if (!comment) throw new NotFoundException('Comment not found.');
    return comment;
  }

  async getCommentsForProject(projectId: number) {
    return await this.commentRepo.find({
      where: { project: { id: Number(projectId) } },
      order: { created_at: 'DESC' },
      relations: ['author', 'file', 'version'],
    });
  }

  async getCommentsForFile(fileId: number) {
    return await this.commentRepo.find({
      where: { file: { id: Number(fileId) } },
      order: { created_at: 'DESC' },
      relations: ['author', 'project', 'version'],
    });
  }

  async getCommentsForVersion(versionId: number) {
    return await this.commentRepo.find({
      where: { version: { id: Number(versionId) } },
      order: { created_at: 'DESC' },
      relations: ['author', 'project', 'file'],
    });
  }

  async updateComment(id: number, content?: string) {
    const comment = await this.getCommentById(id);
    if (content) comment.content = content;
    return await this.commentRepo.save(comment);
  }

  async deleteComment(id: number): Promise<boolean> {
    const result = await this.commentRepo.delete(Number(id));
    return (result.affected ?? 0) > 0;
  }
}
