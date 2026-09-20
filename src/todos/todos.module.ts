import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { TodosService } from './todos.service.js';
import { TodosController } from './todos.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ThrottlerModule.forRootAsync({
      imports: [],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('app.throttleTtl') ?? 60000,
            limit: config.get<number>('app.throttleLimit') ?? 100,
          },
        ],
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [TodosController],
  providers: [TodosService],
})
export class TodosModule {}
