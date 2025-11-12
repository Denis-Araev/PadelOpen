import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';

@Injectable()
export class ClubsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateClubDto) {
    return this.prisma.club.create({ data: dto });
  }

  list() {
    return this.prisma.club.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async byId(id: string) {
    const club = await this.prisma.club.findUnique({ where: { id } });
    if (!club) throw new NotFoundException('Club not found');
    return club;
  }

  async update(id: string, dto: UpdateClubDto) {
    await this.byId(id);
    return this.prisma.club.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.byId(id);
    return this.prisma.club.delete({ where: { id } });
  }
}
