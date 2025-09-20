import { registerEnumType } from '@nestjs/graphql';

export enum RecipeDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

registerEnumType(RecipeDifficulty, {
  name: 'RecipeDifficulty',
  description: 'Recipe difficulty level',
});
