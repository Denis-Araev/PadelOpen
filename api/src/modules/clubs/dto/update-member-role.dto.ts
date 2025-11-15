import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ClubMemberRole } from './add-member.dto';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: ClubMemberRole })
  @IsEnum(ClubMemberRole)
  role!: ClubMemberRole;
}
