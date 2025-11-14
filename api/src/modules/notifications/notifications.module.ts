import { Module } from '@nestjs/common';
import { GameNotificationsListener } from './listeners/game-notifications.listener';

@Module({
  providers: [GameNotificationsListener],
})
export class NotificationsModule {}
