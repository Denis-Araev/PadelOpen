import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryGamesDto } from './dto/query-games.dto';
import { JoinGameDto } from './dto/join-game.dto';
import {
  GameStatus as PrismaGameStatus,
  GameVisibility as PrismaGameVisibility,
  ParticipationRole as PrismaParticipationRole,
  ParticipationStatus as PrismaParticipationStatus,
} from '@prisma/client';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGameDto, createdById: string) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (!(endsAt > startsAt)) {
      throw new BadRequestException('endsAt must be after startsAt');
    }

    const game = await this.prisma.game.create({
      data: {
        clubId: dto.clubId,
        createdById,
        title: dto.title,
        description: dto.description,
        startsAt,
        endsAt,
        timezone: dto.timezone ?? 'Europe/Tallinn',
        maxPlayers: dto.maxPlayers ?? 4,
        visibility:
          (dto.visibility as PrismaGameVisibility | undefined) ??
          PrismaGameVisibility.PUBLIC,
        courtName: dto.courtName,
        levelNote: dto.levelNote,
        participants: {
          create: {
            userId: createdById,
            role: PrismaParticipationRole.ORGANIZER,
            status: PrismaParticipationStatus.GOING,
          },
        },
      },
      include: { participants: true },
    });

    return game;
  }

  list(q: QueryGamesDto) {
    return this.prisma.game.findMany({
      where: {
        clubId: q.clubId ?? undefined,
        status: (q.status as PrismaGameStatus | undefined) ?? undefined,
        startsAt: {
          gte: q.from ? new Date(q.from) : undefined,
          lte: q.to ? new Date(q.to) : undefined,
        },
      },
      orderBy: { startsAt: 'asc' },
      skip: q.offset ?? 0,
      take: q.limit ?? 20,
      include: { participants: true, club: true },
    });
  }

  async byId(id: string) {
    const game = await this.prisma.game.findUnique({
      where: { id },
      include: {
        participants: { include: { user: true } },
        club: true,
        createdBy: true,
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return game;
  }

  // Игрок подаёт заявку на участие (WAITLIST)
  async join(gameId: string, userId: string, dto: JoinGameDto) {
    return this.prisma.$transaction(async (tx) => {
      const game = await tx.game.findUnique({
        where: { id: gameId },
      });

      if (!game) {
        throw new NotFoundException('Game not found');
      }

      const exists = await tx.gameParticipant.findUnique({
        where: { gameId_userId: { gameId, userId } },
      });

      if (exists) {
        throw new BadRequestException('Already joined or requested');
      }

      const participant = await tx.gameParticipant.create({
        data: {
          gameId,
          userId,
          status: PrismaParticipationStatus.WAITLIST,
          role: PrismaParticipationRole.RESERVE,
          note: dto.note,
        },
      });

      return {
        status: participant.status,
        role: participant.role,
        isRequest: true,
      };
    });
  }

  // Игрок отменяет заявку или отказывается от участия
  async leave(gameId: string, userId: string) {
    await this.prisma.$transaction(async (tx) => {
      const membership = await tx.gameParticipant.findUnique({
        where: { gameId_userId: { gameId, userId } },
      });

      if (!membership) {
        throw new NotFoundException('Not a participant');
      }

      if (membership.status === PrismaParticipationStatus.NOT_GOING) {
        return;
      }

      await tx.gameParticipant.update({
        where: { gameId_userId: { gameId, userId } },
        data: { status: PrismaParticipationStatus.NOT_GOING },
      });
    });

    return { ok: true };
  }

  // Организатор утверждает заявку
  async approveParticipant(
    gameId: string,
    actorId: string,
    targetUserId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const game = await tx.game.findUnique({
        where: { id: gameId },
      });

      if (!game) {
        throw new NotFoundException('Game not found');
      }

      if (game.createdById !== actorId) {
        throw new ForbiddenException('Only organizer can approve participants');
      }

      const participant = await tx.gameParticipant.findUnique({
        where: { gameId_userId: { gameId, userId: targetUserId } },
      });

      if (!participant) {
        throw new NotFoundException('Request not found');
      }

      if (participant.status !== PrismaParticipationStatus.WAITLIST) {
        throw new BadRequestException('Participant is not in WAITLIST');
      }

      const goingCount = await tx.gameParticipant.count({
        where: { gameId, status: PrismaParticipationStatus.GOING },
      });

      if (goingCount >= game.maxPlayers) {
        throw new BadRequestException('Game is full');
      }

      const updated = await tx.gameParticipant.update({
        where: { gameId_userId: { gameId, userId: targetUserId } },
        data: {
          status: PrismaParticipationStatus.GOING,
          role: PrismaParticipationRole.PLAYER,
        },
      });

      return updated;
    });
  }

  // Организатор отклоняет заявку
  async rejectParticipant(
    gameId: string,
    actorId: string,
    targetUserId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const game = await tx.game.findUnique({
        where: { id: gameId },
      });

      if (!game) {
        throw new NotFoundException('Game not found');
      }

      if (game.createdById !== actorId) {
        throw new ForbiddenException('Only organizer can reject participants');
      }

      const participant = await tx.gameParticipant.findUnique({
        where: { gameId_userId: { gameId, userId: targetUserId } },
      });

      if (!participant) {
        throw new NotFoundException('Request not found');
      }

      if (participant.status === PrismaParticipationStatus.NOT_GOING) {
        return participant;
      }

      const updated = await tx.gameParticipant.update({
        where: { gameId_userId: { gameId, userId: targetUserId } },
        data: {
          status: PrismaParticipationStatus.NOT_GOING,
          role: PrismaParticipationRole.RESERVE,
        },
      });

      return updated;
    });
  }

  async updateStatus(gameId: string, actorId: string, dto: UpdateStatusDto) {
    const game = await this.byId(gameId);

    if (game.createdById !== actorId) {
      throw new BadRequestException('Forbidden');
    }

    const legal: Record<PrismaGameStatus, PrismaGameStatus[]> = {
      [PrismaGameStatus.SCHEDULED]: [
        PrismaGameStatus.ONGOING,
        PrismaGameStatus.CANCELLED,
      ],
      [PrismaGameStatus.ONGOING]: [
        PrismaGameStatus.FINISHED,
        PrismaGameStatus.CANCELLED,
      ],
      [PrismaGameStatus.FINISHED]: [],
      [PrismaGameStatus.CANCELLED]: [],
    } as const;

    const current = game.status;
    const requested = dto.status as PrismaGameStatus;
    const allowed = legal[current] ?? [];

    if (!allowed.includes(requested)) {
      throw new BadRequestException('Invalid status transition');
    }

    await this.prisma.game.update({
      where: { id: gameId },
      data: { status: requested },
    });

    return { status: requested };
  }
}
