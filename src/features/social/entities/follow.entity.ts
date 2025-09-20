import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class Follow {
  @Field(() => ID)
  id: string;

  @Field()
  createdAt: Date;

  @Field(() => ID)
  followerId: string;

  @Field(() => User)
  follower: User;

  @Field(() => ID)
  followingId: string;

  @Field(() => User)
  following: User;
}
