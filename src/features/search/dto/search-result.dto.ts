import { Field, ObjectType, Float, Int } from '@nestjs/graphql';
import { Recipe } from '../../recipes/entities/recipe.entity';

@ObjectType()
export class SearchResult {
  @Field(() => [Recipe])
  recipes: Recipe[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  took: number; // Search time in milliseconds

  @Field(() => Float, { nullable: true })
  maxScore?: number;
}

@ObjectType()
export class AutocompleteResult {
  @Field(() => [String])
  suggestions: string[];

  @Field(() => Int)
  took: number;
}
