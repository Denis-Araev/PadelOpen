import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { TelegramLoginDto } from './dto/telegram-login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('telegram')
  loginTelegram(@Body() dto: TelegramLoginDto) {
    return this.auth.loginWithTelegram(dto.initData);
  }
}
