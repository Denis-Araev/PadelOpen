import { GameStatus as PrismaGameStatus } from '@prisma/client';

export class GameCreatedEvent {
  constructor(
    public readonly gameId: string,
    public readonly clubId: string,
    public readonly organizerId: string,
  ) {}
}

export class GameStatusChangedEvent {
  constructor(
    public readonly gameId: string,
    public readonly clubId: string,
    public readonly statusFrom: PrismaGameStatus,
    public readonly statusTo: PrismaGameStatus,
  ) {}
}

export class GameJoinRequestedEvent {
  constructor(
    public readonly gameId: string,
    public readonly clubId: string,
    public readonly userId: string,
  ) {}
}

export class GameParticipantApprovedEvent {
  constructor(
    public readonly gameId: string,
    public readonly clubId: string,
    public readonly userId: string,
  ) {}
}

export class GameParticipantRejectedEvent {
  constructor(
    public readonly gameId: string,
    public readonly clubId: string,
    public readonly userId: string,
  ) {}
}
