import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';

import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { RefreshTokenRepository } from './refresh-token.repository.js';
import { JwtGuard } from './guards/jwt.guard.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokenRepository, JwtGuard],
  exports: [AuthService, JwtGuard, PassportModule],
})
export class AuthModule {}
