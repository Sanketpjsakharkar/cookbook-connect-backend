import { PrismaService } from '@/core/database';
import { PubSubService } from '@/core/infrastructure/redis';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '../dto/notification.dto';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        private prismaService: PrismaService,
        private pubSubService: PubSubService,
    ) { }

    async createRecipeNotification(recipeId: string, authorId: string) {
        try {
            // Get recipe details
            const recipe = await this.prismaService.recipe.findUnique({
                where: { id: recipeId },
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                        },
                    },
                },
            });

            if (!recipe) return;

            // Get all followers of the recipe author
            const followers = await this.prismaService.follow.findMany({
                where: { followingId: authorId },
                include: {
                    follower: {
                        select: {
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                        },
                    },
                },
            });

            const activityData = {
                id: `recipe_${recipeId}_${Date.now()}`,
                type: NotificationType.RECIPE_CREATED,
                message: `${recipe.author.username} shared a new recipe: "${recipe.title}"`,
                actor: recipe.author,
                recipe: {
                    id: recipe.id,
                    title: recipe.title,
                    description: recipe.description,
                    imageUrl: recipe.imageUrl,
                    cuisine: recipe.cuisine,
                    difficulty: recipe.difficulty,
                    cookingTime: recipe.cookingTime,
                    createdAt: recipe.createdAt,
                },
                createdAt: new Date(),
            };

            // Publish to each follower's feed
            for (const follow of followers) {
                const channel = PubSubService.getUserFeedChannel(follow.follower.id);
                await this.pubSubService.publish(
                    channel,
                    PubSubService.EVENT_TYPES.RECIPE_CREATED,
                    activityData,
                    authorId,
                );
            }

            // Publish to global activity feed
            await this.pubSubService.publish(
                PubSubService.getGlobalActivityChannel(),
                PubSubService.EVENT_TYPES.RECIPE_CREATED,
                activityData,
                authorId,
            );

            this.logger.debug(`Published recipe notification for ${recipeId} to ${followers.length} followers`);
        } catch (error) {
            this.logger.error('Failed to create recipe notification:', error);
        }
    }

    async createCommentNotification(commentId: string, userId: string, recipeId: string) {
        try {
            // Get comment details
            const comment = await this.prismaService.comment.findUnique({
                where: { id: commentId },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                        },
                    },
                    recipe: {
                        include: {
                            author: {
                                select: {
                                    id: true,
                                    username: true,
                                    firstName: true,
                                    lastName: true,
                                    avatar: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!comment) return;

            const activityData = {
                id: `comment_${commentId}_${Date.now()}`,
                type: NotificationType.COMMENT_CREATED,
                message: `${comment.user.username} commented on "${comment.recipe.title}"`,
                actor: comment.user,
                recipe: {
                    id: comment.recipe.id,
                    title: comment.recipe.title,
                    description: comment.recipe.description,
                    imageUrl: comment.recipe.imageUrl,
                    cuisine: comment.recipe.cuisine,
                    difficulty: comment.recipe.difficulty,
                    cookingTime: comment.recipe.cookingTime,
                    createdAt: comment.recipe.createdAt,
                },
                comment: {
                    id: comment.id,
                    content: comment.content,
                    createdAt: comment.createdAt,
                },
                createdAt: new Date(),
            };

            // Publish to recipe-specific channel
            const recipeChannel = PubSubService.getRecipeChannel(recipeId);
            await this.pubSubService.publish(
                recipeChannel,
                PubSubService.EVENT_TYPES.COMMENT_CREATED,
                activityData,
                userId,
            );

            // Notify recipe author if different from commenter
            if (comment.recipe.authorId !== userId) {
                const authorChannel = PubSubService.getUserFeedChannel(comment.recipe.authorId);
                await this.pubSubService.publish(
                    authorChannel,
                    PubSubService.EVENT_TYPES.COMMENT_CREATED,
                    activityData,
                    userId,
                );
            }

            // Publish to global activity feed
            await this.pubSubService.publish(
                PubSubService.getGlobalActivityChannel(),
                PubSubService.EVENT_TYPES.COMMENT_CREATED,
                activityData,
                userId,
            );

            this.logger.debug(`Published comment notification for ${commentId}`);
        } catch (error) {
            this.logger.error('Failed to create comment notification:', error);
        }
    }

    async createRatingNotification(ratingId: string, userId: string, recipeId: string) {
        try {
            // Get rating details
            const rating = await this.prismaService.rating.findUnique({
                where: { id: ratingId },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                        },
                    },
                    recipe: {
                        include: {
                            author: {
                                select: {
                                    id: true,
                                    username: true,
                                    firstName: true,
                                    lastName: true,
                                    avatar: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!rating) return;

            const activityData = {
                id: `rating_${ratingId}_${Date.now()}`,
                type: NotificationType.RATING_CREATED,
                message: `${rating.user.username} rated "${rating.recipe.title}" ${rating.value} star${rating.value !== 1 ? 's' : ''}`,
                actor: rating.user,
                recipe: {
                    id: rating.recipe.id,
                    title: rating.recipe.title,
                    description: rating.recipe.description,
                    imageUrl: rating.recipe.imageUrl,
                    cuisine: rating.recipe.cuisine,
                    difficulty: rating.recipe.difficulty,
                    cookingTime: rating.recipe.cookingTime,
                    createdAt: rating.recipe.createdAt,
                },
                rating: {
                    id: rating.id,
                    value: rating.value,
                    createdAt: rating.createdAt,
                },
                createdAt: new Date(),
            };

            // Publish to recipe-specific channel
            const recipeChannel = PubSubService.getRecipeChannel(recipeId);
            await this.pubSubService.publish(
                recipeChannel,
                PubSubService.EVENT_TYPES.RATING_CREATED,
                activityData,
                userId,
            );

            // Notify recipe author if different from rater
            if (rating.recipe.authorId !== userId) {
                const authorChannel = PubSubService.getUserFeedChannel(rating.recipe.authorId);
                await this.pubSubService.publish(
                    authorChannel,
                    PubSubService.EVENT_TYPES.RATING_CREATED,
                    activityData,
                    userId,
                );
            }

            this.logger.debug(`Published rating notification for ${ratingId}`);
        } catch (error) {
            this.logger.error('Failed to create rating notification:', error);
        }
    }

    async createFollowNotification(followerId: string, followingId: string) {
        try {
            // Get follow details
            const follow = await this.prismaService.follow.findUnique({
                where: {
                    followerId_followingId: {
                        followerId,
                        followingId,
                    },
                },
                include: {
                    follower: {
                        select: {
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                        },
                    },
                    following: {
                        select: {
                            id: true,
                            username: true,
                            firstName: true,
                            lastName: true,
                            avatar: true,
                        },
                    },
                },
            });

            if (!follow) return;

            const activityData = {
                id: `follow_${followerId}_${followingId}_${Date.now()}`,
                type: NotificationType.USER_FOLLOWED,
                message: `${follow.follower.username} started following you`,
                actor: follow.follower,
                createdAt: new Date(),
            };

            // Notify the user being followed
            const userChannel = PubSubService.getUserFeedChannel(followingId);
            await this.pubSubService.publish(
                userChannel,
                PubSubService.EVENT_TYPES.USER_FOLLOWED,
                activityData,
                followerId,
            );

            this.logger.debug(`Published follow notification from ${followerId} to ${followingId}`);
        } catch (error) {
            this.logger.error('Failed to create follow notification:', error);
        }
    }
}
