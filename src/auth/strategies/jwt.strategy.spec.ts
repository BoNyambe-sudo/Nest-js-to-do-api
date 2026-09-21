import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

import { JwtStrategy } from './jwt.strategy.js';
import appConfig, { AppConfig } from '../../config/app.config.js';
import { JwtPayload } from '../jwt-payload.interface.js';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: appConfig.KEY, useValue: mockConfig },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should validate payload and return userId', async () => {
    const payload: JwtPayload = { sub: 'user-123' };
    const result = await strategy.validate(payload);
    expect(result).toEqual({ userId: 'user-123' });
  });

  it('should throw if no sub in payload', async () => {
    await expect(strategy.validate({} as JwtPayload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
