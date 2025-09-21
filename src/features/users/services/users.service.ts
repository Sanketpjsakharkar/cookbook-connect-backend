import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { UpdateUserInput } from '../dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async findById(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.mapUserWithCounts(user);
  }

  async findByUsername(username: string) {
    const user = await this.usersRepository.findByUsername(username);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.mapUserWithCounts(user);
  }

  async findMany(skip?: number, take?: number) {
    const users = await this.usersRepository.findMany(skip, take);
    return users.map((user: any) => this.mapUserWithCounts(user));
  }

  async updateProfile(id: string, updateUserInput: UpdateUserInput) {
    const user = await this.usersRepository.update(id, updateUserInput);
    return this.mapUserWithCounts(user);
  }

  async getMostFollowedUsers(limit: number = 10) {
    const users = await this.usersRepository.getMostFollowedUsers(limit);
    return users.map((user: any) => this.mapUserWithCounts(user));
  }

  private mapUserWithCounts(user: any) {
    return {
      ...user,
      recipesCount: user._count.recipes,
      followersCount: user._count.followers,
      followingCount: user._count.following,
    };
  }
}
