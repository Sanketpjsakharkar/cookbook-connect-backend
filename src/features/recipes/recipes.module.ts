import { Module } from '@nestjs/common';
import { RecipesService } from './services/recipes.service';
import { RecipesResolver } from './resolvers/recipes.resolver';
import { RecipesRepository } from './repositories/recipes.repository';

@Module({
  providers: [RecipesService, RecipesResolver, RecipesRepository],
  exports: [RecipesService],
})
export class RecipesModule {}
