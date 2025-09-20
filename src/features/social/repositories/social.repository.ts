import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/core/database';
import { CreateRatingInput } from '../dto/create-rating.dto';
import { CreateCommentInput } from '../dto/create-comment.dto';

@Injectable()
export class SocialRepository {
  constructor(private prismaService: PrismaService) {}

  // Rating methods
  async createRating(userId: string, createRatingInput: CreateRatingInput) {
    const { recipeId, value } = createRatingInput;

    // Check if user already rated this recipe
    const existingRating = await this.prismaService.rating.findUnique({
      where: {
        userId_recipeId: {
          userId,
          recipeId,
        },
      },
    });

    if (existingRating) {
      // Update existing rating
      return this.prismaService.rating.update({
        where: { id: existingRating.id },
        data: { value },
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
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    }

    // Create new rating
    return this.prismaService.rating.create({
      data: {
        userId,
        recipeId,
        value,
      },
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
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async deleteRating(userId: string, recipeId: string) {
    return this.prismaService.rating.deleteMany({
      where: {
        userId,
        recipeId,
      },
    });
  }

  async getRatingsByRecipe(recipeId: string, skip?: number, take?: number) {
    return this.prismaService.rating.findMany({
      where: { recipeId },
      skip,
      take,
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Comment methods
  async createComment(userId: string, createCommentInput: CreateCommentInput) {
    const { recipeId, content } = createCommentInput;

    return this.prismaService.comment.create({
      data: {
        userId,
        recipeId,
        content,
      },
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
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async updateComment(id: string, _userId: string, content: string) {
    return this.prismaService.comment.update({
      where: { id },
      data: { content },
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
      },
    });
  }

  async deleteComment(id: string, userId: string) {
    return this.prismaService.comment.deleteMany({
      where: {
        id,
        userId,
      },
    });
  }

  async getCommentsByRecipe(recipeId: string, skip?: number, take?: number) {
    return this.prismaService.comment.findMany({
      where: { recipeId },
      skip,
      take,
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Follow methods
  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new ConflictException('You cannot follow yourself');
    }

    const existingFollow = await this.prismaService.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      throw new ConflictException('You are already following this user');
    }

    return this.prismaService.follow.create({
      data: {
        followerId,
        followingId,
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
  }

  async unfollowUser(followerId: string, followingId: string) {
    return this.prismaService.follow.deleteMany({
      where: {
        followerId,
        followingId,
      },
    });
  }

  async getFollowers(userId: string, skip?: number, take?: number) {
    return this.prismaService.follow.findMany({
      where: { followingId: userId },
      skip,
      take,
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFollowing(userId: string, skip?: number, take?: number) {
    return this.prismaService.follow.findMany({
      where: { followerId: userId },
      skip,
      take,
      include: {
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.prismaService.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
    return !!follow;
  }
}
