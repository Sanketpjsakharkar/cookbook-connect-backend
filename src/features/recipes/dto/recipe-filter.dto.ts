import { Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, IsArray, IsString } from 'class-validator';
import { CuisineType, RecipeDifficulty } from '@/shared/enums';

@InputType()
export class RecipeFilterInput {
  @Field(() => [CuisineType], { nullable: true })
  @IsOptional()
  @IsArray()
  cuisines?: CuisineType[];

  @Field(() => [RecipeDifficulty], { nullable: true })
  @IsOptional()
  @IsArray()
  difficulties?: RecipeDifficulty[];

  @Field(() => Int, { nullable: true })
  @IsOptional()
  maxCookingTime?: number;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ingredients?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  authorId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
}
