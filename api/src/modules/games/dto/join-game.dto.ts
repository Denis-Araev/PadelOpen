import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ParticipationStatus {
  GOING = 'GOING',
  NOT_GOING = 'NOT_GOING',
  MAYBE = 'MAYBE',
  WAITLIST = 'WAITLIST',
}

export enum ParticipationRole {
  PLAYER = 'PLAYER',
  RESERVE = 'RESERVE',
  ORGANIZER = 'ORGANIZER',
}

export class JoinGameDto {
  @ApiPropertyOptional({ enum: ParticipationStatus })
  @IsOptional()
  @IsEnum(ParticipationStatus)
  status?: ParticipationStatus;

  @ApiPropertyOptional({ enum: ParticipationRole })
  @IsOptional()
  @IsEnum(ParticipationRole)
  role?: ParticipationRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
