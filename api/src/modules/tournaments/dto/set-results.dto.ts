import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class TournamentResultItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: 'Place in tournament: 1, 2, 3...' })
  @IsInt()
  @Min(1)
  position!: number;

  @ApiProperty({ required: false, description: 'Points for ranking system' })
  @IsOptional()
  @IsInt()
  points?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class SetTournamentResultsDto {
  @ApiProperty({ type: [TournamentResultItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TournamentResultItemDto)
  results!: TournamentResultItemDto[];
}
