import { PrismaService } from '@/core/database';
import { CuisineType, RecipeDifficulty } from '@/shared/enums';
import { Injectable, Logger } from '@nestjs/common';
import { SearchQueryInput } from '../dto/search-query.dto';
import { AutocompleteResult, SearchResult } from '../dto/search-result.dto';

/**
 * Fallback search service that uses PostgreSQL full-text search
 * when Elasticsearch is not available
 */
@Injectable()
export class FallbackSearchService {
  private readonly logger = new Logger(FallbackSearchService.name);

  constructor(private prismaService: PrismaService) {}

  async searchRecipes(searchQuery: SearchQueryInput): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      this.logger.debug('Using PostgreSQL fallback search');

      // Build where clause for filtering
      const whereClause: any = {
        isPublic: true,
      };

      // Text search using PostgreSQL full-text search
      if (searchQuery.query) {
        whereClause.OR = [
          {
            title: {
              contains: searchQuery.query,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: searchQuery.query,
              mode: 'insensitive',
            },
          },
          {
            ingredients: {
              some: {
                name: {
                  contains: searchQuery.query,
                  mode: 'insensitive',
                },
              },
            },
          },
        ];
      }

      // Cuisine filtering
      if (searchQuery.cuisines && searchQuery.cuisines.length > 0) {
        whereClause.cuisine = {
          in: searchQuery.cuisines,
        };
      }

      // Difficulty filtering
      if (searchQuery.difficulties && searchQuery.difficulties.length > 0) {
        whereClause.difficulty = {
          in: searchQuery.difficulties,
        };
      }

      // Cooking time filtering
      if (searchQuery.maxCookingTime) {
        whereClause.cookingTime = {
          lte: searchQuery.maxCookingTime,
        };
      }

      // Servings filtering
      if (searchQuery.minServings || searchQuery.maxServings) {
        const servingsFilter: any = {};
        if (searchQuery.minServings)
          servingsFilter.gte = searchQuery.minServings;
        if (searchQuery.maxServings)
          servingsFilter.lte = searchQuery.maxServings;
        whereClause.servings = servingsFilter;
      }

      // Author filtering
      if (searchQuery.authorId) {
        whereClause.authorId = searchQuery.authorId;
      }

      // Get total count
      const total = await this.prismaService.recipe.count({
        where: whereClause,
      });

      // Get recipes with pagination
      const recipes = await this.prismaService.recipe.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          ingredients: {
            orderBy: { name: 'asc' },
          },
          instructions: {
            orderBy: { stepNumber: 'asc' },
          },
          _count: {
            select: {
              ratings: true,
              comments: true,
            },
          },
          ratings: {
            select: {
              value: true,
            },
          },
        },
        orderBy: [
          { createdAt: 'desc' }, // Default ordering
        ],
        skip: searchQuery.skip || 0,
        take: Math.min(searchQuery.take || 20, 50), // Limit to 50 results
      });

      // Transform results to match expected format
      const transformedRecipes = recipes.map(recipe => {
        const avgRating =
          recipe.ratings.length > 0
            ? recipe.ratings.reduce((sum, rating) => sum + rating.value, 0) /
              recipe.ratings.length
            : null;

        return {
          ...recipe,
          description: recipe.description || undefined,
          cuisine: (recipe.cuisine as CuisineType) || undefined,
          difficulty: (recipe.difficulty as RecipeDifficulty) || undefined,
          cookingTime: recipe.cookingTime || undefined,
          servings: recipe.servings || undefined,
          imageUrl: recipe.imageUrl || undefined,
          avgRating,
          ratingsCount: recipe._count.ratings,
          commentsCount: recipe._count.comments,
        } as any;
      });

      const took = Date.now() - startTime;

      this.logger.debug(
        `PostgreSQL search completed in ${took}ms, found ${total} results`,
      );

      return {
        recipes: transformedRecipes,
        total,
        took,
        maxScore: undefined, // Not available in PostgreSQL search
      };
    } catch (error) {
      this.logger.error('PostgreSQL search failed:', error);
      throw error;
    }
  }

  async cookWithWhatIHave(
    ingredients: string[],
    options?: { skip?: number; take?: number },
  ): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      this.logger.debug(
        `Searching recipes with ingredients: ${ingredients.join(', ')}`,
      );

      // Find recipes that contain any of the specified ingredients
      const recipes = await this.prismaService.recipe.findMany({
        where: {
          isPublic: true,
          ingredients: {
            some: {
              name: {
                in: ingredients.map(ing => ing.toLowerCase()),
                mode: 'insensitive',
              },
            },
          },
        },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          ingredients: {
            orderBy: { name: 'asc' },
          },
          instructions: {
            orderBy: { stepNumber: 'asc' },
          },
          _count: {
            select: {
              ratings: true,
              comments: true,
            },
          },
          ratings: {
            select: {
              value: true,
            },
          },
        },
        skip: options?.skip || 0,
        take: Math.min(options?.take || 20, 50),
      });

      // Transform results
      const transformedRecipes = recipes.map(recipe => {
        const avgRating =
          recipe.ratings.length > 0
            ? recipe.ratings.reduce((sum, rating) => sum + rating.value, 0) /
              recipe.ratings.length
            : null;

        return {
          ...recipe,
          description: recipe.description || undefined,
          cuisine: (recipe.cuisine as CuisineType) || undefined,
          difficulty: (recipe.difficulty as RecipeDifficulty) || undefined,
          cookingTime: recipe.cookingTime || undefined,
          servings: recipe.servings || undefined,
          imageUrl: recipe.imageUrl || undefined,
          avgRating,
          ratingsCount: recipe._count.ratings,
          commentsCount: recipe._count.comments,
        } as any;
      });

      const took = Date.now() - startTime;

      return {
        recipes: transformedRecipes,
        total: transformedRecipes.length,
        took,
        maxScore: undefined,
      };
    } catch (error) {
      this.logger.error('Cook with what I have search failed:', error);
      throw error;
    }
  }

  async autocompleteIngredients(
    query: string,
    options?: { limit?: number },
  ): Promise<AutocompleteResult> {
    const startTime = Date.now();

    try {
      // Get unique ingredient names that match the query
      const ingredients = await this.prismaService.ingredient.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        select: {
          name: true,
        },
        distinct: ['name'],
        take: options?.limit || 10,
      });

      const suggestions = ingredients.map(ingredient => ingredient.name);
      const took = Date.now() - startTime;

      return {
        suggestions,
        took,
      };
    } catch (error) {
      this.logger.error('Ingredient autocomplete failed:', error);
      throw error;
    }
  }
}
