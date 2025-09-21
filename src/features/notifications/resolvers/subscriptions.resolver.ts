import { PubSubService } from '@/core/infrastructure/redis';
import { CurrentUser } from '@/shared/decorators';
import { JwtAuthGuard } from '@/shared/guards';
import { Inject, Logger, UseGuards } from '@nestjs/common';
import { Args, ID, Resolver, Subscription } from '@nestjs/graphql';
import { ActivityFeedItem } from '../dto/notification.dto';

@Resolver()
@UseGuards(JwtAuthGuard)
export class SubscriptionsResolver {
  private readonly logger = new Logger(SubscriptionsResolver.name);

  constructor(
    @Inject('PUB_SUB') private pubSub: any,
    private pubSubService: PubSubService,
  ) {}

  @Subscription(() => ActivityFeedItem, {
    filter: (payload, variables, context) => {
      // Only send notifications to the intended user
      return payload.userId === context.req.user.id;
    },
  })
  async userFeed(@CurrentUser() user: any) {
    const channel = PubSubService.getUserFeedChannel(user.id);

    // Set up Redis subscription
    this.pubSubService.subscribe(channel, message => {
      this.pubSub.publish('USER_FEED', {
        userFeed: message.data,
        userId: user.id,
      });
    });

    return this.pubSub.asyncIterator('USER_FEED');
  }

  @Subscription(() => ActivityFeedItem, {
    filter: (payload, variables) => {
      // Filter by recipe ID
      return payload.recipeId === variables.recipeId;
    },
  })
  async recipeActivity(
    @Args('recipeId', { type: () => ID }) recipeId: string,
    @CurrentUser() _user: any,
  ) {
    const channel = PubSubService.getRecipeChannel(recipeId);

    // Set up Redis subscription
    this.pubSubService.subscribe(channel, message => {
      this.pubSub.publish('RECIPE_ACTIVITY', {
        recipeActivity: message.data,
        recipeId,
      });
    });

    return this.pubSub.asyncIterator('RECIPE_ACTIVITY');
  }

  @Subscription(() => ActivityFeedItem)
  async globalActivity(@CurrentUser() _user: any) {
    const channel = PubSubService.getGlobalActivityChannel();

    // Set up Redis subscription
    this.pubSubService.subscribe(channel, message => {
      this.pubSub.publish('GLOBAL_ACTIVITY', {
        globalActivity: message.data,
      });
    });

    return this.pubSub.asyncIterator('GLOBAL_ACTIVITY');
  }

  @Subscription(() => ActivityFeedItem, {
    filter: (payload, variables, context) => {
      // Only send new recipe notifications from followed users
      return (
        payload.type === 'RECIPE_CREATED' &&
        payload.userId !== context.req.user.id
      );
    },
  })
  async newRecipeFromFollowedUsers(@CurrentUser() user: any) {
    const channel = PubSubService.getUserFeedChannel(user.id);

    // Set up Redis subscription specifically for new recipes
    this.pubSubService.subscribe(channel, message => {
      if (message.type === PubSubService.EVENT_TYPES.RECIPE_CREATED) {
        this.pubSub.publish('NEW_RECIPE_FROM_FOLLOWED', {
          newRecipeFromFollowedUsers: message.data,
          userId: user.id,
          type: message.type,
        });
      }
    });

    return this.pubSub.asyncIterator('NEW_RECIPE_FROM_FOLLOWED');
  }

  @Subscription(() => ActivityFeedItem, {
    filter: (payload, variables) => {
      return payload.recipeId === variables.recipeId;
    },
  })
  async newCommentOnRecipe(
    @Args('recipeId', { type: () => ID }) recipeId: string,
    @CurrentUser() _user: any,
  ) {
    const channel = PubSubService.getRecipeChannel(recipeId);

    // Set up Redis subscription specifically for new comments
    this.pubSubService.subscribe(channel, message => {
      if (message.type === PubSubService.EVENT_TYPES.COMMENT_CREATED) {
        this.pubSub.publish('NEW_COMMENT_ON_RECIPE', {
          newCommentOnRecipe: message.data,
          recipeId,
        });
      }
    });

    return this.pubSub.asyncIterator('NEW_COMMENT_ON_RECIPE');
  }

  @Subscription(() => ActivityFeedItem, {
    filter: (payload, variables) => {
      return payload.recipeId === variables.recipeId;
    },
  })
  async newRatingOnRecipe(
    @Args('recipeId', { type: () => ID }) recipeId: string,
    @CurrentUser() _user: any,
  ) {
    const channel = PubSubService.getRecipeChannel(recipeId);

    // Set up Redis subscription specifically for new ratings
    this.pubSubService.subscribe(channel, message => {
      if (message.type === PubSubService.EVENT_TYPES.RATING_CREATED) {
        this.pubSub.publish('NEW_RATING_ON_RECIPE', {
          newRatingOnRecipe: message.data,
          recipeId,
        });
      }
    });

    return this.pubSub.asyncIterator('NEW_RATING_ON_RECIPE');
  }
}
