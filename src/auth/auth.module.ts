import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { RefreshTokenRepository } from './refresh-token.repository.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { JwtGuard } from './guards/jwt.guard.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import appConfig from '../config/app.config.js';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('app.jwtSecret'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokenRepository, JwtStrategy, JwtGuard],
  exports: [JwtGuard, AuthService, JwtModule],
})
export class AuthModule {}
