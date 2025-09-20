import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database';
import { UpdateUserInput } from '../dto/update-user.dto';

@Injectable()
export class UsersRepository {
  constructor(private prismaService: PrismaService) {}

  async findById(id: string) {
    return this.prismaService.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            recipes: true,
            followers: true,
            following: true,
          },
        },
      },
    });
  }

  async findByUsername(username: string) {
    return this.prismaService.user.findUnique({
      where: { username },
      include: {
        _count: {
          select: {
            recipes: true,
            followers: true,
            following: true,
          },
        },
      },
    });
  }

  async findMany(skip?: number, take?: number) {
    return this.prismaService.user.findMany({
      skip,
      take,
      where: { isActive: true },
      include: {
        _count: {
          select: {
            recipes: true,
            followers: true,
            following: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, updateUserInput: UpdateUserInput) {
    return this.prismaService.user.update({
      where: { id },
      data: updateUserInput,
      include: {
        _count: {
          select: {
            recipes: true,
            followers: true,
            following: true,
          },
        },
      },
    });
  }

  async getMostFollowedUsers(limit: number = 10) {
    return this.prismaService.user.findMany({
      take: limit,
      where: { isActive: true },
      include: {
        _count: {
          select: {
            recipes: true,
            followers: true,
            following: true,
          },
        },
      },
      orderBy: {
        followers: {
          _count: 'desc',
        },
      },
    });
  }
}
