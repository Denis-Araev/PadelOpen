import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { ClubRole } from '@prisma/client';

@Injectable()
export class ClubMembersService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureCanManageClub(clubId: string, actorId: string) {
    const membership = await this.prisma.clubMember.findFirst({
      where: {
        clubId,
        userId: actorId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Only club owner/admin can manage members');
    }
  }

  async listMembers(clubId: string) {
    const club = await this.prisma.club.findUnique({
      where: { id: clubId },
      include: {
        members: {
          include: { user: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    return club.members;
  }

  async addMember(clubId: string, actorId: string, dto: AddMemberDto) {
    await this.ensureCanManageClub(clubId, actorId);

    const existing = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId: dto.userId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.clubMember.create({
      data: {
        clubId,
        userId: dto.userId,
        role: dto.role as ClubRole,
      },
    });
  }

  async updateMemberRole(
    clubId: string,
    userId: string,
    actorId: string,
    dto: UpdateMemberRoleDto,
  ) {
    await this.ensureCanManageClub(clubId, actorId);

    const membership = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    // нельзя себя разжаловать из OWNER, если ты последний и т.д. — это можно добавить позже
    return this.prisma.clubMember.update({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
      data: {
        role: dto.role as ClubRole,
      },
    });
  }

  async removeMember(clubId: string, userId: string, actorId: string) {
    await this.ensureCanManageClub(clubId, actorId);

    const membership = await this.prisma.clubMember.findUnique({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('Member not found');
    }

    // тут тоже можно будет добавить защиту от удаления последнего OWNER
    await this.prisma.clubMember.delete({
      where: {
        clubId_userId: {
          clubId,
          userId,
        },
      },
    });

    return { ok: true };
  }
}
