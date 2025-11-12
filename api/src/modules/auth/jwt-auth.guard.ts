import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { JwtPayload } from './types';

type AuthenticatedRequest = Request & { user?: JwtPayload };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // Читаем и валидируем заголовок Authorization
    const header = req.headers['authorization'];
    if (typeof header !== 'string') {
      throw new UnauthorizedException('Missing Authorization header');
    }
    if (!header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid Authorization header');
    }
    const token = header.slice(7);

    // Верифицируем токен + приводим к типу
    const decoded = await this.jwt.verifyAsync<JwtPayload>(token);

    // Кладём типизированного пользователя на req.user
    req.user = decoded;
    return true;
  }
}
