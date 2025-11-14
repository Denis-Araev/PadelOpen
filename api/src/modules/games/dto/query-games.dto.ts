import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { GameStatus } from './update-status.dto';

export class QueryGamesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clubId?: string;

  @ApiPropertyOptional({ enum: GameStatus })
  @IsOptional()
  @IsEnum(GameStatus)
  status?: GameStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
