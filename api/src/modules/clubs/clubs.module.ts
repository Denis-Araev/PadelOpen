import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infra/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ClubMembersService } from './club-members.service';
import { ClubMembersController } from './club-members.controller';
import { ClubsService } from './clubs.service';
import { ClubsController } from './clubs.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [ClubsService, ClubMembersService],
  controllers: [ClubsController, ClubMembersController],
})
export class ClubsModule {}
