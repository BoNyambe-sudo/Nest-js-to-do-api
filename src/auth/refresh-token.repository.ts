import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

export interface RefreshToken {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function toRefreshToken(row: {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}): RefreshToken {
  return {
    id: row.id,
    tokenHash: row.tokenHash,
    userId: row.userId,
    expiresAt: new Date(row.expiresAt),
    revokedAt: row.revokedAt ? new Date(row.revokedAt) : null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    try {
      const row = await this.prisma.client.orm.public.RefreshToken.create({
        userId,
        tokenHash,
        expiresAt: expiresAt.toISOString(),
      });
      return toRefreshToken(row);
    } catch (error) {
      if (error instanceof Error && error.message.includes('unique constraint')) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  async findValidByHash(tokenHash: string): Promise<RefreshToken | null> {
    const now = new Date().toISOString();
    const row = await this.prisma.client.orm.public.RefreshToken
      .where({ tokenHash, revokedAt: null })
      .where((t) => t.expiresAt.gt(now))
      .first();
    return row ? toRefreshToken(row) : null;
  }

  async revoke(id: string): Promise<RefreshToken> {
    const row = await this.prisma.client.orm.public.RefreshToken
      .where({ id })
      .update({ revokedAt: new Date().toISOString() });
    if (!row) {
      throw new NotFoundException(`Refresh token with id ${id} not found`);
    }
    return toRefreshToken(row);
  }

  async revokeAllByUser(userId: string): Promise<number> {
    const rows = await this.prisma.client.orm.public.RefreshToken
      .where({ userId, revokedAt: null })
      .update({ revokedAt: new Date().toISOString() });
    return Array.isArray(rows) ? rows.length : 1;
  }
}