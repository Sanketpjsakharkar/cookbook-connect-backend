import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { User } from '../entities/user.entity';
import { UpdateUserInput } from '../dto/update-user.dto';
import { CurrentUser, Public } from '@/shared/decorators';
import { JwtAuthGuard } from '@/shared/guards';

@Resolver(() => User)
@UseGuards(JwtAuthGuard)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Public()
  @Query(() => User)
  async user(@Args('id', { type: () => ID }) id: string): Promise<User> {
    return this.usersService.findById(id);
  }

  @Public()
  @Query(() => User)
  async userByUsername(@Args('username') username: string): Promise<User> {
    return this.usersService.findByUsername(username);
  }

  @Public()
  @Query(() => [User])
  async users(
    @Args('skip', { type: () => Number, nullable: true }) skip?: number,
    @Args('take', { type: () => Number, nullable: true }) take?: number,
  ): Promise<User[]> {
    return this.usersService.findMany(skip, take);
  }

  @Public()
  @Query(() => [User])
  async mostFollowedUsers(
    @Args('limit', { type: () => Number, nullable: true, defaultValue: 10 }) limit: number,
  ): Promise<User[]> {
    return this.usersService.getMostFollowedUsers(limit);
  }

  @Query(() => User)
  async me(@CurrentUser() user: any): Promise<User> {
    return this.usersService.findById(user.id);
  }

  @Mutation(() => User)
  async updateProfile(
    @CurrentUser() user: any,
    @Args('input') updateUserInput: UpdateUserInput,
  ): Promise<User> {
    return this.usersService.updateProfile(user.id, updateUserInput);
  }
}
