import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/core/database';
import { SocialRepository } from '../repositories/social.repository';
import { CreateRatingInput } from '../dto/create-rating.dto';
import { CreateCommentInput } from '../dto/create-comment.dto';

@Injectable()
export class SocialService {
  constructor(
    private socialRepository: SocialRepository,
    private prismaService: PrismaService,
  ) {}

  // Rating methods
  async createOrUpdateRating(userId: string, createRatingInput: CreateRatingInput) {
    return this.socialRepository.createRating(userId, createRatingInput);
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
    return this.socialRepository.createComment(userId, createCommentInput);
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
      throw new NotFoundException('Comment not found or you do not have permission to delete it');
    }
    return true;
  }

  async getCommentsByRecipe(recipeId: string, skip?: number, take?: number) {
    return this.socialRepository.getCommentsByRecipe(recipeId, skip, take);
  }

  // Follow methods
  async followUser(followerId: string, followingId: string) {
    return this.socialRepository.followUser(followerId, followingId);
  }

  async unfollowUser(followerId: string, followingId: string) {
    const result = await this.socialRepository.unfollowUser(followerId, followingId);
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
