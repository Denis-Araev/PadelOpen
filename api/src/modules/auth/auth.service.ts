import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { URLSearchParams } from 'url';
import { parseTgUser } from './utils/parse-tg-user';
import type { TgUser } from './types';
import type { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  verifyTelegramInitData(initData: string) {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) throw new UnauthorizedException('Missing hash');

    // Собираем data-check-string: сортированные пары key=value, кроме "hash"
    const entries: string[] = [];
    params.forEach((value, key) => {
      if (key !== 'hash') entries.push(`${key}=${value}`);
    });
    entries.sort();
    const dataCheckString = entries.join('\n');

    const botToken = process.env.TELEGRAM_BOT_TOKEN!;
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();
    const calcHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calcHash !== hash) throw new UnauthorizedException('Bad signature');

    // Дополнительно проверим auth_date (не старше 1 дня)
    const authDate = Number(params.get('auth_date') ?? 0);
    const now = Math.floor(Date.now() / 1000);
    if (!authDate || now - authDate > 24 * 60 * 60) {
      throw new UnauthorizedException('Login expired');
    }

    // Парсим user (JSON в URL-формате)
    const userJson = params.get('user');
    if (!userJson) throw new UnauthorizedException('No user payload');
    const tgUser: TgUser = parseTgUser(userJson);
    return tgUser as {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
    };
  }

  async loginWithTelegram(initData: string) {
    const tgUser = this.verifyTelegramInitData(initData);
    const tgId = String(tgUser.id);

    // Находим или создаём локального пользователя
    const user: User = await this.prisma.user.upsert({
      where: { tgId },
      update: {
        name:
          [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') ||
          'Player',
      },
      create: {
        tgId,
        name:
          [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') ||
          'Player',
        city: null,
        level: 3.0,
      },
    });

    // Выдаём наш JWT
    const payload = {
      sub: String(user.id),
      uid: user.id,
      name: user.name,
      ...(user.tgId ? { tgId: user.tgId } : {}),
    } as const;

    const accessToken = await this.jwt.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        tgId: user.tgId,
        level: user.level,
        city: user.city,
        isPro: user.isPro,
      },
    };
  }
}
