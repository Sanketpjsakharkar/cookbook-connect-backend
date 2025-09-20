import { Field, InputType, Float } from '@nestjs/graphql';
import { IsString, IsNumber, IsOptional, Min, MaxLength } from 'class-validator';

@InputType()
export class CreateIngredientInput {
  @Field()
  @IsString()
  @MaxLength(100, { message: 'Ingredient name must not exceed 100 characters' })
  name: string;

  @Field(() => Float)
  @IsNumber({}, { message: 'Quantity must be a valid number' })
  @Min(0, { message: 'Quantity must be greater than 0' })
  quantity: number;

  @Field()
  @IsString()
  @MaxLength(50, { message: 'Unit must not exceed 50 characters' })
  unit: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Notes must not exceed 200 characters' })
  notes?: string;
}
