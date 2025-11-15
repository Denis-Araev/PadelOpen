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
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  GameCreatedEvent,
  GameStatusChangedEvent,
  GameJoinRequestedEvent,
  GameParticipantApprovedEvent,
  GameParticipantRejectedEvent,
} from './events/game-events';

@Injectable()
export class GamesService {
  constructor(
    private prisma: PrismaService,
    private events: EventEmitter2,
  ) {}

  private async canManageGame(
    game: { id: string; clubId: string; createdById: string },
    actorId: string,
  ) {
    if (game.createdById === actorId) {
      return true;
    }

    // локально кастуем prisma к any, чтобы не ругался TS/ESLint на clubMember
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const membership = await (this.prisma as any).clubMember.findFirst({
      where: {
        clubId: game.clubId,
        userId: actorId,
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    return Boolean(membership);
  }

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
        isRated: dto.isRated ?? false,
        minLevel: dto.minLevel ?? null,
        maxLevel: dto.maxLevel ?? null,
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
    this.events.emit(
      'game.created',
      new GameCreatedEvent(game.id, game.clubId, createdById),
    );

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

    const { participants, ...rest } = game;

    // Обогащаем участников флагом levelOk
    const participantsWithLevel = participants.map((p) => {
      const level = p.user?.level ?? null;
      const min = rest.minLevel ?? null;
      const max = rest.maxLevel ?? null;

      let levelOk = true;

      if (level !== null) {
        if (min !== null && level < min) {
          levelOk = false;
        }
        if (max !== null && level > max) {
          levelOk = false;
        }
      }

      return {
        ...p,
        levelOk,
      };
    });

    const players = participantsWithLevel.filter(
      (p) => p.status === PrismaParticipationStatus.GOING,
    );
    const requests = participantsWithLevel.filter(
      (p) => p.status === PrismaParticipationStatus.WAITLIST,
    );
    const rejected = participantsWithLevel.filter(
      (p) => p.status === PrismaParticipationStatus.NOT_GOING,
    );
    const maybe = participantsWithLevel.filter(
      (p) => p.status === PrismaParticipationStatus.MAYBE,
    );

    const goingCount = players.length;
    const waitlistCount = requests.length;
    const maybeCount = maybe.length;
    const notGoingCount = rejected.length;

    const freeSlots = Math.max(0, rest.maxPlayers - goingCount);
    const isFull = goingCount >= rest.maxPlayers;

    return {
      ...rest,
      participants: {
        players,
        requests,
        rejected,
        maybe,
      },
      stats: {
        goingCount,
        waitlistCount,
        maybeCount,
        notGoingCount,
        maxPlayers: rest.maxPlayers,
        freeSlots,
        isFull,
      },
    };
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
      this.events.emit(
        'game.join.requested',
        new GameJoinRequestedEvent(gameId, game.clubId, userId),
      );

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

      const canManage = await this.canManageGame(game, actorId);
      if (!canManage) {
        throw new ForbiddenException(
          'Only club admin/owner or game organizer can approve participants',
        );
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
      this.events.emit(
        'game.participant.approved',
        new GameParticipantApprovedEvent(gameId, game.clubId, targetUserId),
      );

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

      const canManage = await this.canManageGame(game, actorId);
      if (!canManage) {
        throw new ForbiddenException(
          'Only club admin/owner or game organizer can reject participants',
        );
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
      this.events.emit(
        'game.participant.rejected',
        new GameParticipantRejectedEvent(gameId, game.clubId, targetUserId),
      );

      return updated;
    });
  }

  async updateStatus(gameId: string, actorId: string, dto: UpdateStatusDto) {
    const game = await this.byId(gameId);

    const canManage = await this.canManageGame(game, actorId);
    if (!canManage) {
      throw new ForbiddenException('Forbidden');
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

    const previous = game.status;

    if (!allowed.includes(requested)) {
      throw new BadRequestException('Invalid status transition');
    }

    await this.prisma.game.update({
      where: { id: gameId },
      data: { status: requested },
    });

    this.events.emit(
      'game.status.changed',
      new GameStatusChangedEvent(gameId, game.clubId, previous, requested),
    );

    return { status: requested };
  }
}
