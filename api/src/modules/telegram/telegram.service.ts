import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  sendMessageToClub(clubId: string, text: string) {
    this.logger.log(`(stub) Telegram message to club ${clubId}: ${text}`);
  }

  sendMessageToUser(userId: string, text: string) {
    this.logger.log(`(stub) Telegram DM to user ${userId}: ${text}`);
  }
}
