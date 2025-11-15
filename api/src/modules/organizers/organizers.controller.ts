import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrganizersService } from './organizers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/types';
import { CreateOrganizerDto } from './dto/create-organizer.dto';
import { UpdateOrganizerDto } from './dto/update-organizer.dto';
import { AddOrganizerMemberDto } from './dto/add-member.dto';
import { UpdateOrganizerMemberDto } from './dto/update-member.dto';

@ApiTags('organizers')
@Controller('organizers')
@UseGuards(JwtAuthGuard)
export class OrganizersController {
  constructor(private readonly organizers: OrganizersService) {}

  @Post()
  create(@Body() dto: CreateOrganizerDto, @CurrentUser() user: JwtPayload) {
    return this.organizers.create(dto, user.sub);
  }

  @Get()
  list() {
    return this.organizers.list();
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.organizers.byId(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizerDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.organizers.update(id, user.sub, dto);
  }

  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @Body() dto: AddOrganizerMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.organizers.addMember(id, user.sub, dto);
  }

  @Patch(':id/members/:memberId')
  updateMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateOrganizerMemberDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.organizers.updateMember(id, user.sub, memberId, dto.role);
  }

  @Post(':id/members/:memberId/remove')
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.organizers.removeMember(id, user.sub, memberId);
  }
}
