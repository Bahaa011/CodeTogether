import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get(':id')
  async getById(@Param('id') id: number) {
    return await this.commentService.getCommentById(id);
  }

  @Get('project/:projectId')
  async getForProject(@Param('projectId') projectId: number) {
    return await this.commentService.getCommentsForProject(projectId);
  }

  @Get('file/:fileId')
  async getForFile(@Param('fileId') fileId: number) {
    return await this.commentService.getCommentsForFile(fileId);
  }

  @Get('version/:versionId')
  async getForVersion(@Param('versionId') versionId: number) {
    return await this.commentService.getCommentsForVersion(versionId);
  }

  @Post()
  async create(@Body() createDto: CreateCommentDto) {
    const { content, authorId, projectId, fileId, versionId } = createDto;

    if (!content || !authorId || !projectId)
      throw new BadRequestException(
        'content, authorId, and projectId are required.',
      );

    return await this.commentService.createComment(
      content,
      authorId,
      projectId,
      fileId,
      versionId,
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateDto: UpdateCommentDto,
  ) {
    const { content } = updateDto;
    if (!content)
      throw new BadRequestException('content must be provided for update.');

    return await this.commentService.updateComment(id, content);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    const deleted = await this.commentService.deleteComment(id);
    if (!deleted) throw new NotFoundException('Comment not found.');
    return { message: 'Comment deleted successfully.' };
  }
}
