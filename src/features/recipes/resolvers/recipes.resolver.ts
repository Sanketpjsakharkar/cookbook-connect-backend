import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { RecipesService } from '../services/recipes.service';
import { Recipe } from '../entities/recipe.entity';
import { CreateRecipeInput } from '../dto/create-recipe.dto';
import { UpdateRecipeInput } from '../dto/update-recipe.dto';
import { RecipeFilterInput } from '../dto/recipe-filter.dto';
import { CurrentUser, Public } from '@/shared/decorators';
import { JwtAuthGuard } from '@/shared/guards';

@Resolver(() => Recipe)
@UseGuards(JwtAuthGuard)
export class RecipesResolver {
  constructor(private recipesService: RecipesService) {}

  @Mutation(() => Recipe)
  async createRecipe(
    @CurrentUser() user: any,
    @Args('input') createRecipeInput: CreateRecipeInput,
  ): Promise<Recipe> {
    return this.recipesService.create(user.id, createRecipeInput);
  }

  @Public()
  @Query(() => Recipe)
  async recipe(@Args('id', { type: () => ID }) id: string): Promise<Recipe> {
    return this.recipesService.findById(id);
  }

  @Public()
  @Query(() => [Recipe])
  async recipes(
    @Args('skip', { type: () => Number, nullable: true }) skip?: number,
    @Args('take', { type: () => Number, nullable: true }) take?: number,
    @Args('filter', { type: () => RecipeFilterInput, nullable: true }) filter?: RecipeFilterInput,
  ): Promise<Recipe[]> {
    return this.recipesService.findMany(skip, take, filter);
  }

  @Public()
  @Query(() => [Recipe])
  async recipesByIngredients(
    @Args('ingredients', { type: () => [String] }) ingredients: string[],
    @Args('limit', { type: () => Number, nullable: true, defaultValue: 20 }) limit: number,
  ): Promise<Recipe[]> {
    return this.recipesService.findByIngredients(ingredients, limit);
  }

  @Query(() => [Recipe])
  async myFeed(
    @CurrentUser() user: any,
    @Args('skip', { type: () => Number, nullable: true }) skip?: number,
    @Args('take', { type: () => Number, nullable: true }) take?: number,
  ): Promise<Recipe[]> {
    return this.recipesService.getUserFeed(user.id, skip, take);
  }

  @Query(() => [Recipe])
  async recommendedRecipes(
    @CurrentUser() user: any,
    @Args('limit', { type: () => Number, nullable: true, defaultValue: 10 }) limit: number,
  ): Promise<Recipe[]> {
    return this.recipesService.getRecipeRecommendations(user.id, limit);
  }

  @Mutation(() => Recipe)
  async updateRecipe(
    @CurrentUser() user: any,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') updateRecipeInput: UpdateRecipeInput,
  ): Promise<Recipe> {
    return this.recipesService.update(id, user.id, updateRecipeInput);
  }

  @Mutation(() => Boolean)
  async deleteRecipe(
    @CurrentUser() user: any,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.recipesService.delete(id, user.id);
  }
}
