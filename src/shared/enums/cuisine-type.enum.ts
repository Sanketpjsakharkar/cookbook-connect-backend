import { registerEnumType } from '@nestjs/graphql';

export enum CuisineType {
  ITALIAN = 'ITALIAN',
  CHINESE = 'CHINESE',
  MEXICAN = 'MEXICAN',
  INDIAN = 'INDIAN',
  FRENCH = 'FRENCH',
  JAPANESE = 'JAPANESE',
  THAI = 'THAI',
  MEDITERRANEAN = 'MEDITERRANEAN',
  AMERICAN = 'AMERICAN',
  OTHER = 'OTHER',
}

registerEnumType(CuisineType, {
  name: 'CuisineType',
  description: 'Type of cuisine',
});
