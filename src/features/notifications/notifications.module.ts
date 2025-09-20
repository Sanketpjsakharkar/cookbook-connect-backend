import { RedisModule } from '@/core/infrastructure/redis';
import { Module } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { SubscriptionsResolver } from './resolvers/subscriptions.resolver';
import { ConnectionManagerService } from './services/connection-manager.service';
import { NotificationsService } from './services/notifications.service';

@Module({
    imports: [RedisModule],
    providers: [
        NotificationsService,
        ConnectionManagerService,
        SubscriptionsResolver,
        {
            provide: 'PUB_SUB',
            useValue: new PubSub(),
        },
    ],
    exports: [NotificationsService, ConnectionManagerService],
})
export class NotificationsModule { }
