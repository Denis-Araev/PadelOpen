import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  GameCreatedEvent,
  GameJoinRequestedEvent,
  GameParticipantApprovedEvent,
  GameParticipantRejectedEvent,
  GameStatusChangedEvent,
} from '../../games/events/game-events';

@Injectable()
export class GameNotificationsListener {
  private readonly logger = new Logger(GameNotificationsListener.name);

  @OnEvent('game.created')
  handleGameCreated(event: GameCreatedEvent) {
    this.logger.log(
      `Game created: gameId=${event.gameId}, clubId=${event.clubId}, organizer=${event.organizerId}`,
    );
    // TODO: отправить уведомление в ТГ-чат клуба
  }

  @OnEvent('game.join.requested')
  handleJoinRequested(event: GameJoinRequestedEvent) {
    this.logger.log(
      `Join requested: gameId=${event.gameId}, userId=${event.userId}`,
    );
    // TODO: уведомить организатора(ов) / админов клуба
  }

  @OnEvent('game.participant.approved')
  handleApproved(event: GameParticipantApprovedEvent) {
    this.logger.log(
      `Participant approved: gameId=${event.gameId}, userId=${event.userId}`,
    );
    // TODO: личное уведомление пользователю
  }

  @OnEvent('game.participant.rejected')
  handleRejected(event: GameParticipantRejectedEvent) {
    this.logger.log(
      `Participant rejected: gameId=${event.gameId}, userId=${event.userId}`,
    );
  }

  @OnEvent('game.status.changed')
  handleStatusChanged(event: GameStatusChangedEvent) {
    this.logger.log(
      `Game status changed: gameId=${event.gameId}, from=${event.statusFrom}, to=${event.statusTo}`,
    );
    // TODO: уведомления при SCHEDULED -> ONGOING, ONGOING -> FINISHED и т.д.
  }
}
