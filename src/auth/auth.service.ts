import { Inject, Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { Prisma, User } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service.js';
import { RefreshTokenRepository } from './refresh-token.repository.js';
import { JwtPayload } from './jwt-payload.interface.js';
import appConfig from '../config/app.config.js';
import type { AppConfig } from '../config/app.config.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    @Inject(appConfig.KEY) private readonly config: AppConfig,
  ) {}

  async register(email: string, password: string): Promise<AuthResponse> {
    const passwordHash = await bcrypt.hash(password, 10);
    let user: User;
    try {
      user = await this.prisma.user.create({
        data: { email, passwordHash },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error as Prisma.PrismaClientKnownRequestError).code === 'P2002'
      ) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
    return this.generateTokens(user.id);
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateTokens(user.id);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.refreshTokenRepo.findValidByHash(tokenHash);
    if (!stored) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: revoke old token and issue a new one
    await this.refreshTokenRepo.revoke(stored.id);
    return this.generateTokens(stored.userId);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.refreshTokenRepo.findValidByHash(tokenHash);
    if (stored && stored.userId === userId) {
      await this.refreshTokenRepo.revoke(stored.id);
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokenRepo.revokeAllByUser(userId);
  }

  private generateTokens(userId: string): Promise<AuthResponse> {
    const payload: JwtPayload = { sub: userId };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.config.jwtAccessTtl,
    });
    const refreshToken = randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + this.config.jwtRefreshTtl);

    return this.refreshTokenRepo
      .create(userId, tokenHash, expiresAt)
      .then(() => ({
        accessToken,
        refreshToken,
      }));
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}