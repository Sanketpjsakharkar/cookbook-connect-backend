import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface PubSubMessage {
    type: string;
    data: any;
    timestamp: number;
    userId?: string;
}

@Injectable()
export class PubSubService {
    private readonly logger = new Logger(PubSubService.name);
    private subscriptions = new Map<string, Set<(message: PubSubMessage) => void>>();

    constructor(private redisService: RedisService) {
        this.setupSubscriber();
    }

    private setupSubscriber() {
        const subscriber = this.redisService.getSubscriber();

        subscriber.on('message', (channel: string, message: string) => {
            try {
                const parsedMessage: PubSubMessage = JSON.parse(message);
                this.handleMessage(channel, parsedMessage);
            } catch (error) {
                this.logger.error(`Failed to parse message from channel ${channel}:`, error);
            }
        });

        subscriber.on('error', (error) => {
            this.logger.error('Redis subscriber error:', error);
        });
    }

    private handleMessage(channel: string, message: PubSubMessage) {
        const callbacks = this.subscriptions.get(channel);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(message);
                } catch (error) {
                    this.logger.error(`Error in subscription callback for channel ${channel}:`, error);
                }
            });
        }
    }

    async publish(channel: string, type: string, data: any, userId?: string): Promise<void> {
        try {
            const message: PubSubMessage = {
                type,
                data,
                timestamp: Date.now(),
                userId,
            };

            const publisher = this.redisService.getPublisher();
            await publisher.publish(channel, JSON.stringify(message));

            this.logger.debug(`Published message to channel ${channel}:`, { type, userId });
        } catch (error) {
            this.logger.error(`Failed to publish to channel ${channel}:`, error);
        }
    }

    async subscribe(channel: string, callback: (message: PubSubMessage) => void): Promise<void> {
        try {
            if (!this.subscriptions.has(channel)) {
                this.subscriptions.set(channel, new Set());
                const subscriber = this.redisService.getSubscriber();
                await subscriber.subscribe(channel);
                this.logger.debug(`Subscribed to channel: ${channel}`);
            }

            this.subscriptions.get(channel)!.add(callback);
        } catch (error) {
            this.logger.error(`Failed to subscribe to channel ${channel}:`, error);
        }
    }

    async unsubscribe(channel: string, callback?: (message: PubSubMessage) => void): Promise<void> {
        try {
            const callbacks = this.subscriptions.get(channel);
            if (!callbacks) return;

            if (callback) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    this.subscriptions.delete(channel);
                    const subscriber = this.redisService.getSubscriber();
                    await subscriber.unsubscribe(channel);
                    this.logger.debug(`Unsubscribed from channel: ${channel}`);
                }
            } else {
                this.subscriptions.delete(channel);
                const subscriber = this.redisService.getSubscriber();
                await subscriber.unsubscribe(channel);
                this.logger.debug(`Unsubscribed from channel: ${channel}`);
            }
        } catch (error) {
            this.logger.error(`Failed to unsubscribe from channel ${channel}:`, error);
        }
    }

    // Channel naming conventions
    static getRecipeChannel(recipeId: string): string {
        return `recipe:${recipeId}`;
    }

    static getUserFeedChannel(userId: string): string {
        return `user:${userId}:feed`;
    }

    static getFollowersChannel(userId: string): string {
        return `user:${userId}:followers`;
    }

    static getGlobalActivityChannel(): string {
        return 'activity:global';
    }

    // Event types
    static readonly EVENT_TYPES = {
        RECIPE_CREATED: 'recipe.created',
        RECIPE_UPDATED: 'recipe.updated',
        RECIPE_DELETED: 'recipe.deleted',
        COMMENT_CREATED: 'comment.created',
        COMMENT_UPDATED: 'comment.updated',
        COMMENT_DELETED: 'comment.deleted',
        RATING_CREATED: 'rating.created',
        RATING_UPDATED: 'rating.updated',
        RATING_DELETED: 'rating.deleted',
        USER_FOLLOWED: 'user.followed',
        USER_UNFOLLOWED: 'user.unfollowed',
    } as const;
}
