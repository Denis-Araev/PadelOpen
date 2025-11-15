import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CreateOrganizerDto } from './dto/create-organizer.dto';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';
import { OrganizerRole } from '@prisma/client';

@Injectable()
export class OrganizersService {
  constructor(private prisma: PrismaService) {}

  /** Проверка прав: owner/admin организатора */
  private async canManageOrganizer(organizerId: string, userId: string) {
    const member = await this.prisma.organizerMember.findUnique({
      where: {
        organizerId_userId: { organizerId, userId },
      },
    });

    if (!member) return false;
    return (
      member.role === OrganizerRole.OWNER || member.role === OrganizerRole.ADMIN
    );
  }

  /** Создание организатора */
  async create(dto: CreateOrganizerDto, createdById: string) {
    return this.prisma.organizer.create({
      data: {
        ...dto,
        createdById,
        members: {
          create: {
            userId: createdById,
            role: OrganizerRole.OWNER,
          },
        },
      },
    });
  }

  /** Получение списка организаторов */
  async list() {
    return this.prisma.organizer.findMany({
      include: { members: true },
    });
  }

  /** Получение организатора */
  async byId(id: string) {
    const organizer = await this.prisma.organizer.findUnique({
      where: { id },
      include: { members: { include: { user: true } } },
    });

    if (!organizer) throw new NotFoundException('Organizer not found');
    return organizer;
  }

  /** Обновление информации об организаторе */
  async update(id: string, userId: string, dto: UpdateOrganizerDto) {
    const can = await this.canManageOrganizer(id, userId);
    if (!can) throw new ForbiddenException('Forbidden');

    return this.prisma.organizer.update({
      where: { id },
      data: dto,
    });
  }

  /** Добавление участника */
  async addMember(
    id: string,
    userId: string,
    target: { userId: string; role: OrganizerRole },
  ) {
    const can = await this.canManageOrganizer(id, userId);
    if (!can) throw new ForbiddenException('Forbidden');

    const exists = await this.prisma.organizerMember.findUnique({
      where: { organizerId_userId: { organizerId: id, userId: target.userId } },
    });

    if (exists) throw new BadRequestException('Member already exists');

    return this.prisma.organizerMember.create({
      data: {
        organizerId: id,
        userId: target.userId,
        role: target.role,
      },
    });
  }

  /** Изменить роль участника */
  async updateMember(
    id: string,
    userId: string,
    memberId: string,
    role: OrganizerRole,
  ) {
    const can = await this.canManageOrganizer(id, userId);
    if (!can) throw new ForbiddenException('Forbidden');

    return this.prisma.organizerMember.update({
      where: { organizerId_userId: { organizerId: id, userId: memberId } },
      data: { role },
    });
  }

  /** Удалить участника */
  async removeMember(id: string, userId: string, memberId: string) {
    const can = await this.canManageOrganizer(id, userId);
    if (!can) throw new ForbiddenException('Forbidden');

    return this.prisma.organizerMember.delete({
      where: { organizerId_userId: { organizerId: id, userId: memberId } },
    });
  }
}
