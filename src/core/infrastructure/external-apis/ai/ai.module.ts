import { Module } from '@nestjs/common';
import { RedisModule } from '../../redis/redis.module';
import { GeminiModule } from '../gemini/gemini.module';
import { OpenAIModule } from '../openai/openai.module';
import { AIServiceFactory } from './ai-service.factory';
import { AIService } from './ai.service';

@Module({
    imports: [
        GeminiModule,
        OpenAIModule,
        RedisModule,
    ],
    providers: [
        AIService,
        AIServiceFactory,
    ],
    exports: [
        AIService,
        AIServiceFactory,
    ],
})
export class AIModule { }
