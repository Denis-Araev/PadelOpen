import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum GameVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export class CreateGameDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  clubId!: string;

  @ApiProperty()
  @IsDateString()
  startsAt!: string;

  @ApiProperty()
  @IsDateString()
  endsAt!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ required: false, minimum: 2, maximum: 8 })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(8)
  maxPlayers?: number;

  @ApiProperty({ required: false, enum: GameVisibility })
  @IsOptional()
  @IsEnum(GameVisibility)
  visibility?: GameVisibility;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  courtName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  levelNote?: string;
}
