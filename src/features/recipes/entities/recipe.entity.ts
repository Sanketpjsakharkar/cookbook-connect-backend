import { Field, ID, ObjectType, Int, Float } from '@nestjs/graphql';
import { CuisineType, RecipeDifficulty } from '@/shared/enums';
import { User } from '../../users/entities/user.entity';
import { Ingredient } from './ingredient.entity';
import { Instruction } from './instruction.entity';

@ObjectType()
export class Recipe {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => CuisineType, { nullable: true })
  cuisine?: CuisineType;

  @Field(() => RecipeDifficulty, { nullable: true })
  difficulty?: RecipeDifficulty;

  @Field(() => Int, { nullable: true })
  cookingTime?: number;

  @Field(() => Int, { nullable: true })
  servings?: number;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field()
  isPublic: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Relations
  @Field(() => ID)
  authorId: string;

  @Field(() => User)
  author: User;

  @Field(() => [Ingredient])
  ingredients: Ingredient[];

  @Field(() => [Instruction])
  instructions: Instruction[];

  // Computed fields
  @Field(() => Float, { nullable: true })
  avgRating?: number;

  @Field(() => Int)
  ratingsCount: number;

  @Field(() => Int)
  commentsCount: number;
}
