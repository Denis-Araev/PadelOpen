import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClubsService } from './clubs.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';

@ApiTags('clubs')
@Controller('clubs')
export class ClubsController {
  constructor(private readonly clubs: ClubsService) {}

  @Post() create(@Body() dto: CreateClubDto) {
    return this.clubs.create(dto);
  }
  @Get() list() {
    return this.clubs.list();
  }
  @Get(':id') byId(@Param('id') id: string) {
    return this.clubs.byId(id);
  }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateClubDto) {
    return this.clubs.update(id, dto);
  }
  @Delete(':id') remove(@Param('id') id: string) {
    return this.clubs.remove(id);
  }
}
