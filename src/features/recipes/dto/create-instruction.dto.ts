import { Field, InputType, Int } from '@nestjs/graphql';
import { IsString, IsNumber, Min, MaxLength } from 'class-validator';

@InputType()
export class CreateInstructionInput {
  @Field(() => Int)
  @IsNumber({}, { message: 'Step number must be a valid number' })
  @Min(1, { message: 'Step number must be at least 1' })
  stepNumber: number;

  @Field()
  @IsString()
  @MaxLength(1000, { message: 'Instruction description must not exceed 1000 characters' })
  description: string;
}
