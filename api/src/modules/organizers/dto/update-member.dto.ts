import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrganizerRole } from '@prisma/client';

export class UpdateOrganizerMemberDto {
  @ApiProperty({ enum: OrganizerRole })
  @IsEnum(OrganizerRole)
  role!: OrganizerRole;
}
