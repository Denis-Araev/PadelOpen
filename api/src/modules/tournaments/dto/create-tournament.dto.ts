import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TournamentFormat } from '@prisma/client';

export class CreateTournamentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TournamentFormat })
  @IsOptional()
  @IsEnum(TournamentFormat)
  format?: TournamentFormat;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clubId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRated?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minLevel?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxLevel?: number;
}
