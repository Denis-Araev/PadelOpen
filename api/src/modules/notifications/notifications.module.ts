import { Module } from '@nestjs/common';
import { GameNotificationsListener } from './listeners/game-notifications.listener';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [TelegramModule],
  providers: [GameNotificationsListener],
})
export class NotificationsModule {}
