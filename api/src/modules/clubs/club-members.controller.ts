import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClubMembersService } from './club-members.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/types';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

@ApiTags('clubs')
@Controller('clubs/:clubId/members')
@UseGuards(JwtAuthGuard)
export class ClubMembersController {
  constructor(private readonly clubMembers: ClubMembersService) {}

  @Get()
  list(@Param('clubId') clubId: string) {
    return this.clubMembers.listMembers(clubId);
  }

  @Post()
  add(
    @Param('clubId') clubId: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.clubMembers.addMember(clubId, user.sub, dto);
  }

  @Patch(':userId')
  updateRole(
    @Param('clubId') clubId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.clubMembers.updateMemberRole(
      clubId,
      targetUserId,
      user.sub,
      dto,
    );
  }

  @Delete(':userId')
  remove(
    @Param('clubId') clubId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.clubMembers.removeMember(clubId, targetUserId, user.sub);
  }
}
