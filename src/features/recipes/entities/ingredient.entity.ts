import { Field, ID, ObjectType, Float } from '@nestjs/graphql';

@ObjectType()
export class Ingredient {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => Float)
  quantity: number;

  @Field()
  unit: string;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => ID)
  recipeId: string;
}
