import { Module } from '@nestjs/common';
import { PubSubService } from './pubsub.service';
import { RedisService } from './redis.service';

@Module({
    providers: [RedisService, PubSubService],
    exports: [RedisService, PubSubService],
})
export class RedisModule { }
