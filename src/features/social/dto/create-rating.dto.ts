import { Field, InputType, Int, ID } from '@nestjs/graphql';
import { IsString, IsNumber, Min, Max } from 'class-validator';

@InputType()
export class CreateRatingInput {
  @Field(() => ID)
  @IsString()
  recipeId: string;

  @Field(() => Int)
  @IsNumber({}, { message: 'Rating value must be a number' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must not exceed 5' })
  value: number;
}
