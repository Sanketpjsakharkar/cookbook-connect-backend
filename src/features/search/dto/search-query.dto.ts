import { Field, InputType, Int } from '@nestjs/graphql';
import { IsString, IsOptional, IsArray, Min, Max } from 'class-validator';
import { CuisineType, RecipeDifficulty } from '@/shared/enums';

@InputType()
export class SearchQueryInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  query?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ingredients?: string[];

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
  @Min(1)
  maxCookingTime?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(1)
  @Max(20)
  minServings?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(1)
  @Max(20)
  maxServings?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  authorId?: string;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @Min(0)
  skip?: number = 0;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  @IsOptional()
  @Min(1)
  @Max(100)
  take?: number = 20;
}
