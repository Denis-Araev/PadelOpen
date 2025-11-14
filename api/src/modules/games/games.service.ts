/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateStatusDto, GameStatus } from './dto/update-status.dto';
import { QueryGamesDto } from './dto/query-games.dto';
import {
  JoinGameDto,
  ParticipationRole,
  ParticipationStatus,
} from './dto/join-game.dto';

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
        visibility: (dto.visibility ?? 'PUBLIC') as any,
        courtName: dto.courtName,
        levelNote: dto.levelNote,
        participants: {
          create: {
            userId: createdById,
            role: ParticipationRole.ORGANIZER as any,
            status: ParticipationStatus.GOING as any,
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
        status: (q.status as any) ?? undefined,
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
    if (!game) throw new NotFoundException('Game not found');
    return game;
  }

  async join(gameId: string, userId: string, dto: JoinGameDto) {
    const game = await this.byId(gameId);
    const exists = await this.prisma.gameParticipant.findUnique({
      where: { gameId_userId: { gameId, userId } },
    });
    if (exists) {
      throw new BadRequestException('Already joined');
    }

    const goingCount = await this.prisma.gameParticipant.count({
      where: { gameId, status: 'GOING' as any },
    });
    const isFull = goingCount >= game.maxPlayers;

    const status: ParticipationStatus =
      dto.status ??
      (isFull ? ParticipationStatus.WAITLIST : ParticipationStatus.GOING);

    if (
      (dto.status ?? ParticipationStatus.GOING) === ParticipationStatus.GOING &&
      isFull
    ) {
      throw new BadRequestException('Game is full');
    }

    const role: ParticipationRole =
      dto.role ??
      (status === ParticipationStatus.GOING
        ? ParticipationRole.PLAYER
        : ParticipationRole.RESERVE);

    await this.prisma.gameParticipant.create({
      data: {
        gameId,
        userId,
        status: status as any,
        role: role as any,
        note: dto.note,
      },
    });

    return {
      status,
      role,
      isWaitlist: status === ParticipationStatus.WAITLIST,
    };
  }

  async leave(gameId: string, userId: string) {
    const membership = await this.prisma.gameParticipant.findUnique({
      where: { gameId_userId: { gameId, userId } },
    });
    if (!membership) {
      throw new NotFoundException('Not a participant');
    }

    await this.prisma.gameParticipant.delete({
      where: { gameId_userId: { gameId, userId } },
    });
    return { ok: true };
  }

  async updateStatus(gameId: string, actorId: string, dto: UpdateStatusDto) {
    const game = await this.byId(gameId);

    // менять статус может создатель
    if (game.createdById !== actorId) {
      throw new BadRequestException('Forbidden');
    }

    const legal: Record<GameStatus, GameStatus[]> = {
      [GameStatus.SCHEDULED]: [GameStatus.ONGOING, GameStatus.CANCELLED],
      [GameStatus.ONGOING]: [GameStatus.FINISHED, GameStatus.CANCELLED],
      [GameStatus.FINISHED]: [],
      [GameStatus.CANCELLED]: [],
    } as const;

    const current = game.status as GameStatus;
    const allowed = legal[current] ?? [];

    if (!allowed.includes(dto.status)) {
      throw new BadRequestException('Invalid status transition');
    }

    await this.prisma.game.update({
      where: { id: gameId },
      data: { status: dto.status as any },
    });

    return { status: dto.status };
  }
}
