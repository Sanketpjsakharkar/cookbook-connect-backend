import { Field, InputType, ID } from '@nestjs/graphql';
import { IsString, MaxLength } from 'class-validator';

@InputType()
export class CreateCommentInput {
  @Field(() => ID)
  @IsString()
  recipeId: string;

  @Field()
  @IsString()
  @MaxLength(1000, { message: 'Comment must not exceed 1000 characters' })
  content: string;
}
