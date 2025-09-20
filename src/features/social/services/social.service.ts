import { PrismaService } from '@/core/database';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentInput } from '../dto/create-comment.dto';
import { CreateRatingInput } from '../dto/create-rating.dto';
import { SocialRepository } from '../repositories/social.repository';

@Injectable()
export class SocialService {
  constructor(
    private socialRepository: SocialRepository,
    private prismaService: PrismaService,
  ) {}

  // Rating methods
  async createOrUpdateRating(
    userId: string,
    createRatingInput: CreateRatingInput,
  ) {
    const rating = await this.socialRepository.createRating(
      userId,
      createRatingInput,
    );

    // TODO: Add real-time notification back later

    return rating;
  }

  async deleteRating(userId: string, recipeId: string) {
    const result = await this.socialRepository.deleteRating(userId, recipeId);
    if (result.count === 0) {
      throw new NotFoundException('Rating not found');
    }
    return true;
  }

  async getRatingsByRecipe(recipeId: string, skip?: number, take?: number) {
    return this.socialRepository.getRatingsByRecipe(recipeId, skip, take);
  }

  // Comment methods
  async createComment(userId: string, createCommentInput: CreateCommentInput) {
    const comment = await this.socialRepository.createComment(
      userId,
      createCommentInput,
    );

    // TODO: Add real-time notification back later

    return comment;
  }

  async updateComment(id: string, userId: string, content: string) {
    // First check if comment exists and belongs to user
    const comment = await this.prismaService.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    return this.socialRepository.updateComment(id, userId, content);
  }

  async deleteComment(id: string, userId: string) {
    const result = await this.socialRepository.deleteComment(id, userId);
    if (result.count === 0) {
      throw new NotFoundException(
        'Comment not found or you do not have permission to delete it',
      );
    }
    return true;
  }

  async getCommentsByRecipe(recipeId: string, skip?: number, take?: number) {
    return this.socialRepository.getCommentsByRecipe(recipeId, skip, take);
  }

  // Follow methods
  async followUser(followerId: string, followingId: string) {
    const follow = await this.socialRepository.followUser(
      followerId,
      followingId,
    );

    // TODO: Add real-time notification back later

    return follow;
  }

  async unfollowUser(followerId: string, followingId: string) {
    const result = await this.socialRepository.unfollowUser(
      followerId,
      followingId,
    );
    if (result.count === 0) {
      throw new NotFoundException('Follow relationship not found');
    }
    return true;
  }

  async getFollowers(userId: string, skip?: number, take?: number) {
    return this.socialRepository.getFollowers(userId, skip, take);
  }

  async getFollowing(userId: string, skip?: number, take?: number) {
    return this.socialRepository.getFollowing(userId, skip, take);
  }

  async isFollowing(followerId: string, followingId: string) {
    return this.socialRepository.isFollowing(followerId, followingId);
  }
}
