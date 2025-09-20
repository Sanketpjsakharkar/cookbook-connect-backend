import { Module } from '@nestjs/common';
import { RedisModule } from '@/core/infrastructure/redis';
import { OpenAIService } from './openai.service';

@Module({
  imports: [RedisModule],
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class OpenAIModule {}
