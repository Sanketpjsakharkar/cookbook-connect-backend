import { Field, ID, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class Instruction {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  stepNumber: number;

  @Field()
  description: string;

  @Field(() => ID)
  recipeId: string;
}
