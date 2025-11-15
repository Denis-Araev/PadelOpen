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
import { TournamentsService } from './tournaments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/types';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { SetTournamentResultsDto } from './dto/set-results.dto';

@ApiTags('tournaments')
@Controller('tournaments')
@UseGuards(JwtAuthGuard)
export class TournamentsController {
  constructor(private readonly tournaments: TournamentsService) {}

  @Post()
  create(@Body() dto: CreateTournamentDto, @CurrentUser() user: JwtPayload) {
    return this.tournaments.create(dto, user.sub);
  }

  @Get()
  list() {
    return this.tournaments.list();
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.tournaments.byId(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTournamentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tournaments.update(id, user.sub, dto);
  }

  @Post(':id/results')
  setResults(
    @Param('id') id: string,
    @Body() dto: SetTournamentResultsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tournaments.setResults(id, user.sub, dto);
  }
}
