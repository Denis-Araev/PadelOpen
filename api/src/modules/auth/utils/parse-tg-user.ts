import { UnauthorizedException } from '@nestjs/common';
import type { TgUser } from '../types';

export function parseTgUser(json: string): TgUser {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new UnauthorizedException('Bad user payload');
  }
  if (!raw || typeof raw !== 'object' || !('id' in raw)) {
    throw new UnauthorizedException('Bad user payload');
  }
  const u = raw as Partial<TgUser>;
  const idNum = Number(u.id);
  if (!Number.isFinite(idNum)) throw new UnauthorizedException('Bad user id');
  return {
    id: idNum,
    first_name: typeof u.first_name === 'string' ? u.first_name : undefined,
    last_name: typeof u.last_name === 'string' ? u.last_name : undefined,
    username: typeof u.username === 'string' ? u.username : undefined,
    photo_url: typeof u.photo_url === 'string' ? u.photo_url : undefined,
  };
}
