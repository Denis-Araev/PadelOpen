import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { SetTournamentResultsDto } from './dto/set-results.dto';
import { OrganizerRole, TournamentStatus } from '@prisma/client';

@Injectable()
export class TournamentsService {
  constructor(private readonly prisma: PrismaService) {}

  private async canManageTournament(tournamentId: string, userId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: {
        id: true,
        createdById: true,
        organizerId: true,
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    // создатель турнира всегда может
    if (tournament.createdById === userId) return true;

    // если есть organizer — проверяем роль
    if (tournament.organizerId) {
      const orgMember = await this.prisma.organizerMember.findUnique({
        where: {
          organizerId_userId: {
            organizerId: tournament.organizerId,
            userId,
          },
        },
      });

      if (
        orgMember &&
        (orgMember.role === OrganizerRole.OWNER ||
          orgMember.role === OrganizerRole.ADMIN)
      ) {
        return true;
      }
    }

    return false;
  }

  async create(dto: CreateTournamentDto, createdById: string) {
    // если указан organizerId → проверяем права
    if (dto.organizerId) {
      const membership = await this.prisma.organizerMember.findUnique({
        where: {
          organizerId_userId: {
            organizerId: dto.organizerId,
            userId: createdById,
          },
        },
      });

      if (
        !membership ||
        (membership.role !== OrganizerRole.OWNER &&
          membership.role !== OrganizerRole.ADMIN)
      ) {
        throw new ForbiddenException(
          'Only organizer owner/admin can create tournaments',
        );
      }
    }

    return this.prisma.tournament.create({
      data: {
        title: dto.title,
        description: dto.description,
        format: dto.format ?? 'OTHER',
        createdById,
        organizerId: dto.organizerId ?? null,
        clubId: dto.clubId ?? null,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        isRated: dto.isRated ?? false,
        minLevel: dto.minLevel ?? null,
        maxLevel: dto.maxLevel ?? null,
      },
    });
  }

  async list() {
    return this.prisma.tournament.findMany({
      orderBy: { startsAt: 'desc' },
    });
  }

  async byId(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        organizer: true,
        club: true,
        results: {
          include: { user: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    return tournament;
  }

  async update(id: string, userId: string, dto: UpdateTournamentDto) {
    const can = await this.canManageTournament(id, userId);
    if (!can) {
      throw new ForbiddenException('Forbidden');
    }

    return this.prisma.tournament.update({
      where: { id },
      data: {
        title: dto.title ?? undefined,
        description: dto.description ?? undefined,
        format: dto.format ?? undefined,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        isRated: dto.isRated ?? undefined,
        minLevel: dto.minLevel ?? undefined,
        maxLevel: dto.maxLevel ?? undefined,
      },
    });
  }

  async setResults(id: string, userId: string, dto: SetTournamentResultsDto) {
    const can = await this.canManageTournament(id, userId);
    if (!can) {
      throw new ForbiddenException('Forbidden');
    }

    return this.prisma.$transaction(async (tx) => {
      // очищаем старые результаты
      await tx.tournamentResult.deleteMany({
        where: { tournamentId: id },
      });

      // записываем новые
      await Promise.all(
        dto.results.map((r) =>
          tx.tournamentResult.create({
            data: {
              tournamentId: id,
              userId: r.userId,
              position: r.position,
              points: r.points ?? null,
              comment: r.comment ?? null,
            },
          }),
        ),
      );

      // помечаем турнир как завершённый
      await tx.tournament.update({
        where: { id },
        data: { status: TournamentStatus.FINISHED },
      });

      return tx.tournament.findUnique({
        where: { id },
        include: {
          results: {
            include: { user: true },
            orderBy: { position: 'asc' },
          },
        },
      });
    });
  }
}
