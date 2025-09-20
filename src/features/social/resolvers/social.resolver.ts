import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SocialService } from '../services/social.service';
import { Rating } from '../entities/rating.entity';
import { Comment } from '../entities/comment.entity';
import { Follow } from '../entities/follow.entity';
import { CreateRatingInput } from '../dto/create-rating.dto';
import { CreateCommentInput } from '../dto/create-comment.dto';
import { CurrentUser, Public } from '@/shared/decorators';
import { JwtAuthGuard } from '@/shared/guards';

@Resolver()
@UseGuards(JwtAuthGuard)
export class SocialResolver {
  constructor(private socialService: SocialService) {}

  // Rating mutations and queries
  @Mutation(() => Rating)
  async rateRecipe(
    @CurrentUser() user: any,
    @Args('input') createRatingInput: CreateRatingInput,
  ): Promise<Rating> {
    return this.socialService.createOrUpdateRating(user.id, createRatingInput) as any;
  }

  @Mutation(() => Boolean)
  async deleteRating(
    @CurrentUser() user: any,
    @Args('recipeId', { type: () => ID }) recipeId: string,
  ): Promise<boolean> {
    return this.socialService.deleteRating(user.id, recipeId);
  }

  @Public()
  @Query(() => [Rating])
  async recipeRatings(
    @Args('recipeId', { type: () => ID }) recipeId: string,
    @Args('skip', { type: () => Number, nullable: true }) skip?: number,
    @Args('take', { type: () => Number, nullable: true }) take?: number,
  ): Promise<Rating[]> {
    return this.socialService.getRatingsByRecipe(recipeId, skip, take) as any;
  }

  // Comment mutations and queries
  @Mutation(() => Comment)
  async createComment(
    @CurrentUser() user: any,
    @Args('input') createCommentInput: CreateCommentInput,
  ): Promise<Comment> {
    return this.socialService.createComment(user.id, createCommentInput) as any;
  }

  @Mutation(() => Comment)
  async updateComment(
    @CurrentUser() user: any,
    @Args('id', { type: () => ID }) id: string,
    @Args('content') content: string,
  ): Promise<Comment> {
    return this.socialService.updateComment(id, user.id, content) as any;
  }

  @Mutation(() => Boolean)
  async deleteComment(
    @CurrentUser() user: any,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.socialService.deleteComment(id, user.id);
  }

  @Public()
  @Query(() => [Comment])
  async recipeComments(
    @Args('recipeId', { type: () => ID }) recipeId: string,
    @Args('skip', { type: () => Number, nullable: true }) skip?: number,
    @Args('take', { type: () => Number, nullable: true }) take?: number,
  ): Promise<Comment[]> {
    return this.socialService.getCommentsByRecipe(recipeId, skip, take) as any;
  }

  // Follow mutations and queries
  @Mutation(() => Follow)
  async followUser(
    @CurrentUser() user: any,
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<Follow> {
    return this.socialService.followUser(user.id, userId) as any;
  }

  @Mutation(() => Boolean)
  async unfollowUser(
    @CurrentUser() user: any,
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<boolean> {
    return this.socialService.unfollowUser(user.id, userId);
  }

  @Public()
  @Query(() => [Follow])
  async userFollowers(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('skip', { type: () => Number, nullable: true }) skip?: number,
    @Args('take', { type: () => Number, nullable: true }) take?: number,
  ): Promise<Follow[]> {
    return this.socialService.getFollowers(userId, skip, take) as any;
  }

  @Public()
  @Query(() => [Follow])
  async userFollowing(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('skip', { type: () => Number, nullable: true }) skip?: number,
    @Args('take', { type: () => Number, nullable: true }) take?: number,
  ): Promise<Follow[]> {
    return this.socialService.getFollowing(userId, skip, take) as any;
  }

  @Query(() => Boolean)
  async isFollowing(
    @CurrentUser() user: any,
    @Args('userId', { type: () => ID }) userId: string,
  ): Promise<boolean> {
    return this.socialService.isFollowing(user.id, userId);
  }
}
