import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import ms from 'ms';

const expiresInEnv = process.env.JWT_EXPIRES ?? '7d';
const expiresInMs = ms(expiresInEnv as ms.StringValue);
const expiresInSeconds = expiresInMs
  ? Math.floor(expiresInMs / 1000)
  : 60 * 60 * 24 * 7;

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET!,
      signOptions: { expiresIn: expiresInSeconds },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
