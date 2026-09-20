import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  jwtSecret: string;
  jwtAccessTtl: number;
  jwtRefreshTtl: number;
  throttleTtl: number;
  throttleLimit: number;
}

export default registerAs('app', (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtAccessTtl: parseInt(process.env.JWT_ACCESS_TTL ?? '900', 10),
  jwtRefreshTtl: parseInt(process.env.JWT_REFRESH_TTL ?? '604800', 10),
  throttleTtl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
  throttleLimit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
}));