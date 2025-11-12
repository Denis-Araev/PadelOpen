import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { JwtPayload } from './types';

type AuthenticatedRequest = Request & { user?: JwtPayload };

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): JwtPayload => {
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!req.user) {
      throw new Error('No authenticated user on request');
    }
    return req.user;
  },
);
