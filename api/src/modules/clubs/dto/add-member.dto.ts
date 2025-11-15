import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum ClubMemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export class AddMemberDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ enum: ClubMemberRole, default: ClubMemberRole.MEMBER })
  @IsEnum(ClubMemberRole)
  role: ClubMemberRole = ClubMemberRole.MEMBER;
}
