import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  GameCreatedEvent,
  GameJoinRequestedEvent,
  GameParticipantApprovedEvent,
  GameParticipantRejectedEvent,
  GameStatusChangedEvent,
} from '../../games/events/game-events';
import { TelegramService } from '../../telegram/telegram.service';

@Injectable()
export class GameNotificationsListener {
  constructor(private readonly telegram: TelegramService) {}

  @OnEvent('game.created')
  handleGameCreated(event: GameCreatedEvent) {
    this.telegram.sendMessageToClub(
      event.clubId,
      `Создана новая игра #${event.gameId}`,
    );
  }

  @OnEvent('game.join.requested')
  handleJoinRequested(event: GameJoinRequestedEvent) {
    this.telegram.sendMessageToClub(
      event.clubId,
      `Новая заявка на игру #${event.gameId} от пользователя ${event.userId}`,
    );
  }

  @OnEvent('game.participant.approved')
  handleApproved(event: GameParticipantApprovedEvent) {
    this.telegram.sendMessageToUser(
      event.userId,
      `Ваша заявка на игру #${event.gameId} одобрена`,
    );
  }

  @OnEvent('game.participant.rejected')
  handleRejected(event: GameParticipantRejectedEvent) {
    this.telegram.sendMessageToUser(
      event.userId,
      `Ваша заявка на игру #${event.gameId} отклонена`,
    );
  }

  @OnEvent('game.status.changed')
  handleStatusChanged(event: GameStatusChangedEvent) {
    this.telegram.sendMessageToClub(
      event.clubId,
      `Статус игры #${event.gameId} изменён: ${event.statusFrom} → ${event.statusTo}`,
    );
  }
}
