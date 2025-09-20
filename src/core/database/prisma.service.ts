import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

    async enableShutdownHooks(app: { close: () => Promise<void> }) {
        // Note: Prisma v5+ doesn't support beforeExit event
        // This is kept for compatibility but may not work as expected
        process.on('beforeExit', async () => {
            await app.close();
        });
    }
}
