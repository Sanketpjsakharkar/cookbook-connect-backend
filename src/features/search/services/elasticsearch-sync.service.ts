import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@/core/infrastructure/elasticsearch';
import { PrismaService } from '@/core/database';

@Injectable()
export class ElasticsearchSyncService {
  private readonly logger = new Logger(ElasticsearchSyncService.name);

  constructor(
    private elasticsearchService: ElasticsearchService,
    private prismaService: PrismaService,
  ) {}

  async syncRecipe(recipeId: string) {
    try {
      const recipe = await this.prismaService.recipe.findUnique({
        where: { id: recipeId },
        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },
          ingredients: true,
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
      });

      if (!recipe) {
        this.logger.warn(`Recipe ${recipeId} not found for sync`);
        return;
      }

      // Only sync public recipes
      if (!recipe.isPublic) {
        await this.deleteRecipe(recipeId);
        return;
      }

      const avgRating = recipe.ratings.length > 0
        ? recipe.ratings.reduce((sum, rating) => sum + rating.value, 0) / recipe.ratings.length
        : null;

      const document = {
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        cuisine: recipe.cuisine,
        difficulty: recipe.difficulty,
        cookingTime: recipe.cookingTime,
        servings: recipe.servings,
        isPublic: recipe.isPublic,
        authorId: recipe.authorId,
        authorUsername: recipe.author.username,
        ingredients: recipe.ingredients.map(ingredient => ({
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
        })),
        instructions: recipe.instructions.map(instruction => ({
          stepNumber: instruction.stepNumber,
          description: instruction.description,
        })),
        avgRating,
        ratingsCount: recipe._count.ratings,
        commentsCount: recipe._count.comments,
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt,
      };

      await this.elasticsearchService.indexDocument('recipes', recipe.id, document);
      
      // Also sync ingredients for autocomplete
      await this.syncIngredients(recipe.ingredients.map(i => i.name));
      
      this.logger.debug(`✅ Synced recipe ${recipe.id} to Elasticsearch`);
    } catch (error) {
      this.logger.error(`❌ Failed to sync recipe ${recipeId}:`, error);
      throw error;
    }
  }

  async deleteRecipe(recipeId: string) {
    try {
      await this.elasticsearchService.deleteDocument('recipes', recipeId);
      this.logger.debug(`🗑️ Deleted recipe ${recipeId} from Elasticsearch`);
    } catch (error: any) {
      // Ignore 404 errors (document doesn't exist)
      if (error?.statusCode !== 404) {
        this.logger.error(`❌ Failed to delete recipe ${recipeId}:`, error);
        throw error;
      }
    }
  }

  async syncIngredients(ingredientNames: string[]) {
    try {
      const uniqueIngredients = [...new Set(ingredientNames.map(name => name.toLowerCase()))];
      
      for (const ingredientName of uniqueIngredients) {
        // Get usage count from database
        const usageCount = await this.prismaService.ingredient.count({
          where: {
            name: {
              equals: ingredientName,
              mode: 'insensitive',
            },
          },
        });

        const document = {
          name: ingredientName,
          usageCount,
          category: this.categorizeIngredient(ingredientName),
        };

        await this.elasticsearchService.indexDocument(
          'ingredients',
          ingredientName.replace(/\s+/g, '_').toLowerCase(),
          document,
        );
      }
    } catch (error) {
      this.logger.error('❌ Failed to sync ingredients:', error);
    }
  }

  async bulkSyncRecipes() {
    this.logger.log('🔄 Starting bulk recipe sync...');
    
    try {
      const recipes = await this.prismaService.recipe.findMany({
        where: { isPublic: true },
        include: {
          author: {
            select: {
              id: true,
              username: true,
            },
          },
          ingredients: true,
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
      });

      const documents = recipes.map(recipe => {
        const avgRating = recipe.ratings.length > 0
          ? recipe.ratings.reduce((sum, rating) => sum + rating.value, 0) / recipe.ratings.length
          : null;

        return {
          id: recipe.id,
          document: {
            id: recipe.id,
            title: recipe.title,
            description: recipe.description,
            cuisine: recipe.cuisine,
            difficulty: recipe.difficulty,
            cookingTime: recipe.cookingTime,
            servings: recipe.servings,
            isPublic: recipe.isPublic,
            authorId: recipe.authorId,
            authorUsername: recipe.author.username,
            ingredients: recipe.ingredients.map(ingredient => ({
              name: ingredient.name,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
            })),
            instructions: recipe.instructions.map(instruction => ({
              stepNumber: instruction.stepNumber,
              description: instruction.description,
            })),
            avgRating,
            ratingsCount: recipe._count.ratings,
            commentsCount: recipe._count.comments,
            createdAt: recipe.createdAt,
            updatedAt: recipe.updatedAt,
          },
        };
      });

      if (documents.length > 0) {
        await this.elasticsearchService.bulkIndex('recipes', documents);
        this.logger.log(`✅ Bulk synced ${documents.length} recipes`);
      }

      // Sync all ingredients
      const allIngredients = recipes.flatMap(recipe => recipe.ingredients.map(i => i.name));
      await this.syncIngredients(allIngredients);
      
    } catch (error) {
      this.logger.error('❌ Bulk sync failed:', error);
      throw error;
    }
  }

  private categorizeIngredient(ingredientName: string): string {
    const name = ingredientName.toLowerCase();
    
    // Simple categorization - in production, you might use a more sophisticated approach
    if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || 
        name.includes('fish') || name.includes('salmon') || name.includes('meat')) {
      return 'protein';
    }
    
    if (name.includes('onion') || name.includes('garlic') || name.includes('tomato') || 
        name.includes('carrot') || name.includes('pepper') || name.includes('lettuce')) {
      return 'vegetable';
    }
    
    if (name.includes('apple') || name.includes('banana') || name.includes('orange') || 
        name.includes('berry') || name.includes('lemon') || name.includes('lime')) {
      return 'fruit';
    }
    
    if (name.includes('flour') || name.includes('rice') || name.includes('pasta') || 
        name.includes('bread') || name.includes('oats') || name.includes('quinoa')) {
      return 'grain';
    }
    
    if (name.includes('milk') || name.includes('cheese') || name.includes('butter') || 
        name.includes('cream') || name.includes('yogurt')) {
      return 'dairy';
    }
    
    if (name.includes('salt') || name.includes('pepper') || name.includes('basil') || 
        name.includes('oregano') || name.includes('thyme') || name.includes('spice')) {
      return 'seasoning';
    }
    
    return 'other';
  }
}
