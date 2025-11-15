import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { OrganizerRole } from '@prisma/client';

export class AddOrganizerMemberDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ enum: OrganizerRole })
  @IsEnum(OrganizerRole)
  role!: OrganizerRole;
}
