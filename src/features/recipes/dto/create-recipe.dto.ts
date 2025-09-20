import { Field, InputType, Int } from '@nestjs/graphql';
import { IsString, IsOptional, IsArray, ArrayMinSize, ValidateNested, IsBoolean, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { CuisineType, RecipeDifficulty } from '@/shared/enums';
import { CreateIngredientInput } from './create-ingredient.dto';
import { CreateInstructionInput } from './create-instruction.dto';

@InputType()
export class CreateRecipeInput {
  @Field()
  @IsString()
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @Field(() => CuisineType, { nullable: true })
  @IsOptional()
  cuisine?: CuisineType;

  @Field(() => RecipeDifficulty, { nullable: true })
  @IsOptional()
  difficulty?: RecipeDifficulty;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(1, { message: 'Cooking time must be at least 1 minute' })
  cookingTime?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(1, { message: 'Servings must be at least 1' })
  servings?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @Field({ defaultValue: true })
  @IsBoolean()
  isPublic: boolean = true;

  @Field(() => [CreateIngredientInput])
  @IsArray()
  @ArrayMinSize(1, { message: 'Recipe must have at least one ingredient' })
  @ValidateNested({ each: true })
  @Type(() => CreateIngredientInput)
  ingredients: CreateIngredientInput[];

  @Field(() => [CreateInstructionInput])
  @IsArray()
  @ArrayMinSize(1, { message: 'Recipe must have at least one instruction' })
  @ValidateNested({ each: true })
  @Type(() => CreateInstructionInput)
  instructions: CreateInstructionInput[];
}
