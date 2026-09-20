import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { validate } from './env.validation.js';
import appConfig from './app.config.js';

@Module({
  imports: [
    NestConfigModule.forRoot({
      load: [appConfig],
      validate,
      isGlobal: true,
    }),
  ],
})
export class ConfigModule {}
