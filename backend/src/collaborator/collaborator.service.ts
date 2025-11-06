import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collaborator } from './collaborator.entity';
import { Project } from '../project/project.entity';
import { User } from '../user/user.entity';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class CollaboratorService {
  constructor(
    @InjectRepository(Collaborator)
    private readonly collabRepo: Repository<Collaborator>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationService: NotificationService,
  ) {}

  // ---------------- CREATE ----------------
  async addCollaborator(
    userId: number,
    projectId: number,
    role: string = 'editor',
  ) {
    const existing = await this.collabRepo.findOne({
      where: {
        project: { id: Number(projectId) },
        user: { id: Number(userId) },
      },
    });
    if (existing) return existing;

    const collaborator = this.collabRepo.create({
      user: { id: Number(userId) },
      project: { id: Number(projectId) },
      role,
    });
    return await this.collabRepo.save(collaborator);
  }

  // ---------------- READ (GET) ----------------
  async getAllCollaborators() {
    return await this.collabRepo.find({ relations: ['user', 'project'] });
  }

  async getCollaboratorsByProject(projectId: number) {
    return await this.collabRepo.find({
      where: { project: { id: projectId } },
      relations: ['user'],
    });
  }

  async getCollaboratorsByUser(userId: number) {
    return await this.collabRepo.find({
      where: { user: { id: userId } },
      relations: ['project', 'project.owner'],
    });
  }

  async countCollaborationsByUser(userId: number) {
    return await this.collabRepo.count({
      where: { user: { id: Number(userId) } },
    });
  }

  // ---------------- UPDATE ----------------
  async updateCollaboratorRole(id: number, newRole: string) {
    const collab = await this.collabRepo.findOne({ where: { id: Number(id) } });
    if (!collab) throw new NotFoundException('Collaborator not found.');
    collab.role = newRole;
    return await this.collabRepo.save(collab);
  }

  // ---------------- DELETE ----------------
  async removeCollaborator(id: number): Promise<boolean> {
    const result = await this.collabRepo.delete(Number(id));
    return (result.affected ?? 0) > 0;
  }

  async inviteCollaborator(
    inviterId: number,
    projectId: number,
    inviteeIdentifier: string,
  ) {
    const project = await this.projectRepo.findOne({
      where: { id: Number(projectId) },
      relations: ['owner', 'collaborators', 'collaborators.user'],
    });
    if (!project) throw new NotFoundException('Project not found.');

    const ownerId = project.owner?.id ?? project.ownerId ?? null;
    if (ownerId !== Number(inviterId)) {
      throw new ForbiddenException(
        'Only the project owner can invite collaborators.',
      );
    }

    const trimmedIdentifier = inviteeIdentifier.trim();
    if (!trimmedIdentifier) {
      throw new BadRequestException(
        'Invitee identifier (email or username) is required.',
      );
    }

    const inviteeByEmail = await this.userRepo.findOne({
      where: { email: trimmedIdentifier },
    });
    const inviteeByLowerEmail =
      inviteeByEmail ||
      (await this.userRepo.findOne({
        where: { email: trimmedIdentifier.toLowerCase() },
      }));
    const invitee =
      inviteeByLowerEmail ||
      (await this.userRepo.findOne({
        where: { username: trimmedIdentifier },
      }));

    if (!invitee) {
      throw new NotFoundException('User not found for the provided identifier.');
    }

    if (invitee.id === ownerId) {
      throw new BadRequestException('Project owners cannot invite themselves.');
    }

    const alreadyCollaborator = project.collaborators?.some(
      (collaborator) => collaborator.user?.id === invitee.id,
    );
    if (alreadyCollaborator) {
      throw new BadRequestException(
        'This user is already a collaborator on the project.',
      );
    }

    const pendingInvite =
      await this.notificationService.findPendingCollaborationInvite(
        invitee.id,
        project.id,
      );
    if (pendingInvite) {
      throw new BadRequestException(
        'An invitation is already pending for this user.',
      );
    }

    const inviterName = project.owner?.username ?? 'A teammate';
    const message = `${inviterName} invited you to collaborate on ${project.title}.`;

    const metadata = {
      projectId: project.id,
      projectTitle: project.title,
      inviterId: ownerId,
      inviterName,
      inviteeId: invitee.id,
      status: 'pending',
    };

    await this.notificationService.createNotification(
      invitee.id,
      message,
      'collaboration_invite',
      metadata,
    );

    return { message: 'Invitation sent successfully.' };
  }

  async respondToInvite(
    notificationId: number,
    userId: number,
    accept: boolean,
  ) {
    const notification =
      await this.notificationService.getNotificationById(notificationId);

    if (notification.type !== 'collaboration_invite') {
      throw new BadRequestException(
        'Notification is not a collaboration invite.',
      );
    }

    const metadata = (notification.metadata ?? {}) as Record<
      string,
      unknown
    >;
    const inviteeId = Number(metadata.inviteeId);

    if (inviteeId !== Number(userId)) {
      throw new ForbiddenException(
        'You are not allowed to respond to this invitation.',
      );
    }

    if (metadata.status && metadata.status !== 'pending') {
      throw new BadRequestException('This invitation has already been handled.');
    }

    const projectId = Number(metadata.projectId);
    if (!projectId) {
      throw new BadRequestException('Invalid invitation data.');
    }

    if (accept) {
      await this.addCollaborator(userId, projectId, 'editor');
      metadata.status = 'accepted';
    } else {
      metadata.status = 'declined';
    }
    metadata.respondedAt = new Date().toISOString();

    notification.metadata = metadata;
    notification.is_read = true;
    notification.read_at = new Date();

    await this.notificationService.saveNotification(notification);

    return {
      message: accept
        ? 'Invitation accepted. You now have access to the project.'
        : 'Invitation declined.',
      accepted: accept,
    };
  }
}
