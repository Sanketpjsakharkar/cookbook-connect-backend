import { PrismaService } from '@/core/database';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRecipeInput } from '../dto/create-recipe.dto';
import { RecipeFilterInput } from '../dto/recipe-filter.dto';
import { UpdateRecipeInput } from '../dto/update-recipe.dto';
import { RecipesRepository } from '../repositories/recipes.repository';

@Injectable()
export class RecipesService {
  constructor(
    private recipesRepository: RecipesRepository,
    private prismaService: PrismaService,
  ) {}

  async create(authorId: string, createRecipeInput: CreateRecipeInput) {
    const recipe = await this.recipesRepository.create(
      authorId,
      createRecipeInput,
    );

    // TODO: Add Elasticsearch sync and notifications back later
    // Sync with Elasticsearch asynchronously
    // Send real-time notification asynchronously

    return this.mapRecipeWithStats(recipe);
  }

  async findById(id: string) {
    const recipe = await this.recipesRepository.findById(id);
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }
    return this.mapRecipeWithStats(recipe);
  }

  async findMany(skip?: number, take?: number, filter?: RecipeFilterInput) {
    const recipes = await this.recipesRepository.findMany(skip, take, filter);
    return recipes.map(recipe => this.mapRecipeWithStats(recipe));
  }

  async update(
    id: string,
    userId: string,
    updateRecipeInput: UpdateRecipeInput,
  ) {
    const existingRecipe = await this.recipesRepository.findById(id);
    if (!existingRecipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (existingRecipe.authorId !== userId) {
      throw new ForbiddenException('You can only update your own recipes');
    }

    const recipe = await this.recipesRepository.update(id, updateRecipeInput);

    // TODO: Add Elasticsearch sync back later

    return this.mapRecipeWithStats(recipe);
  }

  async delete(id: string, userId: string) {
    const existingRecipe = await this.recipesRepository.findById(id);
    if (!existingRecipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (existingRecipe.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own recipes');
    }

    await this.recipesRepository.delete(id);

    // TODO: Add Elasticsearch sync back later

    return true;
  }

  async findByIngredients(ingredientNames: string[], limit: number = 20) {
    const recipes = await this.recipesRepository.findByIngredients(
      ingredientNames,
      limit,
    );
    return recipes.map(recipe => this.mapRecipeWithStats(recipe));
  }

  async getUserFeed(userId: string, skip?: number, take?: number) {
    const recipes = await this.recipesRepository.findUserFeed(
      userId,
      skip,
      take,
    );
    return recipes.map(recipe => this.mapRecipeWithStats(recipe));
  }

  async getRecipeRecommendations(userId: string, limit: number = 10) {
    // This is a simplified recommendation algorithm
    // In a real application, you might use more sophisticated ML algorithms

    // Get user's highly rated recipes to understand preferences
    const userRatings = await this.prismaService.rating.findMany({
      where: {
        userId,
        value: { gte: 4 },
      },
      include: {
        recipe: {
          include: {
            ingredients: true,
          },
        },
      },
      take: 20,
    });

    // Extract preferred ingredients
    const preferredIngredients = userRatings
      .flatMap(rating => rating.recipe.ingredients.map(ing => ing.name))
      .reduce(
        (acc, ingredient) => {
          acc[ingredient] = (acc[ingredient] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    // Get top preferred ingredients
    const topIngredients = Object.entries(preferredIngredients)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ingredient]) => ingredient);

    if (topIngredients.length === 0) {
      // Fallback to popular recipes if no preferences found
      return this.findMany(0, limit, { cuisines: undefined });
    }

    return this.findByIngredients(topIngredients, limit);
  }

  private mapRecipeWithStats(recipe: any) {
    const avgRating =
      recipe.ratings.length > 0
        ? recipe.ratings.reduce(
            (sum: number, rating: any) => sum + rating.value,
            0,
          ) / recipe.ratings.length
        : null;

    return {
      ...recipe,
      avgRating,
      ratingsCount: recipe._count.ratings,
      commentsCount: recipe._count.comments,
    };
  }
}
