import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum GameStatus {
  SCHEDULED = 'SCHEDULED',
  ONGOING = 'ONGOING',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

export class UpdateStatusDto {
  @ApiProperty({ enum: GameStatus })
  @IsEnum(GameStatus)
  status!: GameStatus;
}
