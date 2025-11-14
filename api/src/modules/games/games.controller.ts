import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { QueryGamesDto } from './dto/query-games.dto';
import { JoinGameDto } from './dto/join-game.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/types';

@ApiTags('games')
@Controller('games')
@UseGuards(JwtAuthGuard)
export class GamesController {
  constructor(private readonly games: GamesService) {}

  @Post()
  create(@Body() dto: CreateGameDto, @CurrentUser() user: JwtPayload) {
    return this.games.create(dto, user.sub);
  }

  @Get()
  list(@Query() q: QueryGamesDto) {
    return this.games.list(q);
  }

  @Get(':id')
  byId(@Param('id') id: string) {
    return this.games.byId(id);
  }

  @Post(':id/join')
  join(
    @Param('id') id: string,
    @Body() dto: JoinGameDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.games.join(id, user.sub, dto);
  }

  @Post(':id/leave')
  leave(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.games.leave(id, user.sub);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.games.updateStatus(id, user.sub, dto);
  }
}
