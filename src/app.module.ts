import { Module } from '@nestjs/common';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule as AppConfigModule } from './config/config.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { TodosModule } from './todos/todos.module.js';

@Module({
  imports: [AppConfigModule, PrismaModule, AuthModule, TodosModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
