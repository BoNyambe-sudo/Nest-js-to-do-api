import { IsInt, IsString, IsOptional, IsPort, Min } from 'class-validator';

export class EnvVariables {
  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsInt()
  @Min(1)
  JWT_ACCESS_TTL: number;

  @IsInt()
  @Min(1)
  JWT_REFRESH_TTL: number;

  @IsPort()
  @IsOptional()
  PORT?: string;

  @IsInt()
  @Min(1)
  THROTTLE_TTL: number;

  @IsInt()
  @Min(1)
  THROTTLE_LIMIT: number;
}
