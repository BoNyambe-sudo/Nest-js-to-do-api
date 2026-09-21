import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service.js';
import { RefreshTokenRepository } from './refresh-token.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';
import appConfig, { AppConfig } from '../config/app.config.js';

interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RefreshToken {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const createMockQueryBuilder = () => ({
  where: vi.fn().mockReturnThis(),
  first: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
  all: vi.fn(),
});

const mockPrismaService = {
  client: {
    orm: {
      public: {
        User: createMockQueryBuilder(),
        RefreshToken: createMockQueryBuilder(),
        Todo: createMockQueryBuilder(),
      },
    },
  },
};

const mockRefreshTokenRepo = {
  findValidByHash: vi.fn(),
  revoke: vi.fn(),
  revokeAllByUser: vi.fn(),
  create: vi.fn(),
};

const mockConfig: AppConfig = {
  jwtSecret: 'test-secret',
  jwtAccessTtl: 900,
  jwtRefreshTtl: 604800,
  port: 3000,
  nodeEnv: 'test',
  databaseUrl: 'postgresql://localhost/test',
  throttleTtl: 60000,
  throttleLimit: 100,
};

const mockJwtService = {
  sign: vi.fn(),
};

vi.mock('bcrypt');
const bcrypt = await import('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RefreshTokenRepository, useValue: mockRefreshTokenRepo },
        { provide: appConfig.KEY, useValue: mockConfig },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should hash password and create user', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed');
      mockPrismaService.client.orm.public.User.create.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User);
      mockJwtService.sign.mockReturnValue('access-token');
      mockRefreshTokenRepo.create.mockResolvedValue({} as RefreshToken);

      const result = await service.register('test@example.com', 'password123');

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockPrismaService.client.orm.public.User.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        passwordHash: 'hashed',
      });
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw ConflictException if email already exists', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed');
      mockPrismaService.client.orm.public.User.create.mockRejectedValue(new Error('unique constraint'));
      mockJwtService.sign.mockReturnValue('access-token');
      mockRefreshTokenRepo.create.mockResolvedValue({} as RefreshToken);

      await expect(
        service.register('test@example.com', 'password123'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should throw if user not found', async () => {
      mockPrismaService.client.orm.public.User.first.mockResolvedValue(null);
      await expect(
        service.login('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if password invalid', async () => {
      mockPrismaService.client.orm.public.User.first.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User);
      vi.mocked(bcrypt.compare).mockResolvedValue(false);
      await expect(
        service.login('test@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens on valid login', async () => {
      mockPrismaService.client.orm.public.User.first.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User);
      vi.mocked(bcrypt.compare).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('access-token');
      mockRefreshTokenRepo.create.mockResolvedValue({} as RefreshToken);

      const result = await service.login('test@example.com', 'password');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('refresh', () => {
    it('should throw if token invalid', async () => {
      mockRefreshTokenRepo.findValidByHash.mockResolvedValue(null);
      await expect(service.refresh('invalid')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should rotate and return new tokens', async () => {
      mockRefreshTokenRepo.findValidByHash.mockResolvedValue({
        id: 'rt1',
        userId: '1',
      } as RefreshToken);
      mockRefreshTokenRepo.revoke.mockResolvedValue({} as RefreshToken);
      mockRefreshTokenRepo.create.mockResolvedValue({} as RefreshToken);
      mockJwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refresh('valid-refresh-token');
      expect(mockRefreshTokenRepo.revoke).toHaveBeenCalledWith('rt1');
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should revoke the token', async () => {
      mockRefreshTokenRepo.findValidByHash.mockResolvedValue({
        id: 'rt1',
        userId: '1',
      } as RefreshToken);
      mockRefreshTokenRepo.revoke.mockResolvedValue({} as RefreshToken);
      await service.logout('1', 'refresh-token');
      expect(mockRefreshTokenRepo.revoke).toHaveBeenCalledWith('rt1');
    });
  });

  describe('logoutAll', () => {
    it('should revoke all tokens for user', async () => {
      mockRefreshTokenRepo.revokeAllByUser.mockResolvedValue(3);
      await service.logoutAll('1');
      expect(mockRefreshTokenRepo.revokeAllByUser).toHaveBeenCalledWith('1');
    });
  });
});