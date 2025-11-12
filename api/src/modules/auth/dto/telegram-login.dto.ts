import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TelegramLoginDto {
  @ApiProperty({
    description: 'Строка initData из Telegram Login Widget',
    example: 'query_id=...&user=%7B%22id%22%3A123...%7D&auth_date=...&hash=...',
  })
  @IsString()
  initData: string;
}
