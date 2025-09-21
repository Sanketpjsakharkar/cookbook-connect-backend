import { Module } from '@nestjs/common';
import { RedisModule } from '../../redis';
import { GeminiService } from './gemini.service';

@Module({
    imports: [RedisModule],
    providers: [GeminiService],
    exports: [GeminiService],
})
export class GeminiModule { }
