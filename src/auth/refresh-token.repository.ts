import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<{ id: string; tokenHash: string; userId: string; expiresAt: Date; revokedAt: Date | null; createdAt: Date; updatedAt: Date }> {
    try {
      return await this.prisma.client.orm.public.RefreshToken.create({
        userId,
        tokenHash,
        expiresAt,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('unique constraint')) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async findValidByHash(tokenHash: string): Promise<{ id: string; tokenHash: string; userId: string; expiresAt: Date; revokedAt: Date | null; createdAt: Date; updatedAt: Date } | null> {
    return this.prisma.client.orm.public.RefreshToken
      .where({ tokenHash, revokedAt: null, expiresAt: { gt: new Date() } })
      .first();
  }

  async revoke(id: string): Promise<{ id: string; tokenHash: string; userId: string; expiresAt: Date; revokedAt: Date | null; createdAt: Date; updatedAt: Date }> {
    return this.prisma.client.orm.public.RefreshToken
      .where({ id })
      .update({ revokedAt: new Date() });
  }

  async revokeAllByUser(userId: string): Promise<number> {
    const result = await this.prisma.client.orm.public.RefreshToken
      .where({ userId, revokedAt: null })
      .update({ revokedAt: new Date() });
    return result.count;
  }
}