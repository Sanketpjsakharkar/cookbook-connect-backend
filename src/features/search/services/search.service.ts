import { PrismaService } from '@/core/database';
import { ElasticsearchService } from '@/core/infrastructure/elasticsearch';
import { CuisineType, RecipeDifficulty } from '@/shared/enums';
import { Injectable, Logger } from '@nestjs/common';
import { SearchQueryInput } from '../dto/search-query.dto';
import { AutocompleteResult, SearchResult } from '../dto/search-result.dto';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private elasticsearchService: ElasticsearchService,
    private prismaService: PrismaService,
  ) {}

  async searchRecipes(searchQuery: SearchQueryInput): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      const query = this.buildSearchQuery(searchQuery);

      const response = await this.elasticsearchService.search('recipes', {
        query: query.query,
        sort: query.sort,
        from: searchQuery.skip || 0,
        size: searchQuery.take || 20,
        _source: ['id'], // Only return IDs for efficiency
      });

      const recipeIds = response.hits.hits.map((hit: any) => hit._source.id);

      // Fetch full recipe data from database to ensure consistency
      const recipes = await this.fetchRecipesFromDatabase(recipeIds);

      const took = Date.now() - startTime;

      return {
        recipes,
        total:
          typeof response.hits.total === 'number'
            ? response.hits.total
            : (response.hits.total as { value: number })?.value || 0,
        took,
        maxScore: response.hits.max_score || undefined,
      };
    } catch (error) {
      this.logger.error('Search failed:', error);
      throw error;
    }
  }

  async cookWithWhatIHave(
    ingredients: string[],
    limit: number = 20,
  ): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      const query = {
        query: {
          bool: {
            must: [{ term: { isPublic: true } }],
            should: ingredients.map(ingredient => ({
              nested: {
                path: 'ingredients',
                query: {
                  bool: {
                    should: [
                      {
                        match: {
                          'ingredients.name': {
                            query: ingredient,
                            boost: 2,
                          },
                        },
                      },
                      {
                        match: {
                          'ingredients.name.keyword': {
                            query: ingredient,
                            boost: 3,
                          },
                        },
                      },
                    ],
                  },
                },
                score_mode: 'sum',
              },
            })),
            minimum_should_match: 1,
          },
        },
        sort: [
          { _score: { order: 'desc' } },
          { avgRating: { order: 'desc', missing: '_last' } },
          { ratingsCount: { order: 'desc' } },
          { createdAt: { order: 'desc' } },
        ],
        from: 0,
        size: limit,
        _source: ['id'],
      };

      const response = await this.elasticsearchService.search('recipes', query);
      const recipeIds = response.hits.hits.map((hit: any) => hit._source.id);
      const recipes = await this.fetchRecipesFromDatabase(recipeIds);

      const took = Date.now() - startTime;

      return {
        recipes,
        total:
          typeof response.hits.total === 'number'
            ? response.hits.total
            : (response.hits.total as { value: number })?.value || 0,
        took,
        maxScore: response.hits.max_score || undefined,
      };
    } catch (error) {
      this.logger.error('Cook with what I have search failed:', error);
      throw error;
    }
  }

  async autocompleteIngredients(
    query: string,
    limit: number = 10,
  ): Promise<AutocompleteResult> {
    const startTime = Date.now();

    try {
      const searchQuery = {
        query: {
          bool: {
            should: [
              {
                match: {
                  'name.autocomplete': {
                    query,
                    boost: 2,
                  },
                },
              },
              {
                prefix: {
                  'name.keyword': {
                    value: query.toLowerCase(),
                    boost: 3,
                  },
                },
              },
              {
                wildcard: {
                  'name.keyword': {
                    value: `*${query.toLowerCase()}*`,
                    boost: 1,
                  },
                },
              },
            ],
          },
        },
        sort: [
          { usageCount: { order: 'desc' } },
          { _score: { order: 'desc' } },
        ],
        size: limit,
        _source: ['name'],
      };

      const response = await this.elasticsearchService.search(
        'ingredients',
        searchQuery,
      );

      const suggestions = response.hits.hits.map(
        (hit: any) => hit._source.name,
      );
      const took = Date.now() - startTime;

      return {
        suggestions,
        took,
      };
    } catch (error) {
      this.logger.error('Autocomplete failed:', error);
      throw error;
    }
  }

  private buildSearchQuery(searchQuery: SearchQueryInput) {
    const mustClauses: object[] = [{ term: { isPublic: true } }];

    const shouldClauses: object[] = [];
    const filterClauses: object[] = [];

    // Text search
    if (searchQuery.query) {
      shouldClauses.push(
        {
          multi_match: {
            query: searchQuery.query,
            fields: [
              'title^3',
              'title.autocomplete^2',
              'description^1',
              'ingredients.name^2',
              'instructions.description^1',
            ],
            type: 'best_fields',
            fuzziness: 'AUTO',
          },
        },
        {
          match_phrase: {
            title: {
              query: searchQuery.query,
              boost: 5,
            },
          },
        },
      );
    }

    // Ingredient filtering
    if (searchQuery.ingredients && searchQuery.ingredients.length > 0) {
      searchQuery.ingredients.forEach(ingredient => {
        mustClauses.push({
          nested: {
            path: 'ingredients',
            query: {
              match: {
                'ingredients.name': {
                  query: ingredient,
                  fuzziness: 'AUTO',
                },
              },
            },
          },
        });
      });
    }

    // Cuisine filtering
    if (searchQuery.cuisines && searchQuery.cuisines.length > 0) {
      filterClauses.push({
        terms: { cuisine: searchQuery.cuisines },
      });
    }

    // Difficulty filtering
    if (searchQuery.difficulties && searchQuery.difficulties.length > 0) {
      filterClauses.push({
        terms: { difficulty: searchQuery.difficulties },
      });
    }

    // Cooking time filtering
    if (searchQuery.maxCookingTime) {
      filterClauses.push({
        range: {
          cookingTime: {
            lte: searchQuery.maxCookingTime,
          },
        },
      });
    }

    // Servings filtering
    if (searchQuery.minServings || searchQuery.maxServings) {
      const servingsRange: { gte?: number; lte?: number } = {};
      if (searchQuery.minServings) servingsRange.gte = searchQuery.minServings;
      if (searchQuery.maxServings) servingsRange.lte = searchQuery.maxServings;

      filterClauses.push({
        range: { servings: servingsRange },
      });
    }

    // Author filtering
    if (searchQuery.authorId) {
      filterClauses.push({
        term: { authorId: searchQuery.authorId },
      });
    }

    const query = {
      query: {
        bool: {
          must: mustClauses,
          should: shouldClauses.length > 0 ? shouldClauses : undefined,
          filter: filterClauses.length > 0 ? filterClauses : undefined,
          minimum_should_match: shouldClauses.length > 0 ? 1 : undefined,
        },
      },
      sort: [
        { _score: { order: 'desc' } },
        { avgRating: { order: 'desc', missing: '_last' } },
        { ratingsCount: { order: 'desc' } },
        { createdAt: { order: 'desc' } },
      ],
    };

    return query;
  }

  private async fetchRecipesFromDatabase(recipeIds: string[]) {
    if (recipeIds.length === 0) return [];

    const recipes = await this.prismaService.recipe.findMany({
      where: {
        id: { in: recipeIds },
        isPublic: true,
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
          orderBy: { name: 'asc' as const },
        },
        instructions: {
          orderBy: { stepNumber: 'asc' as const },
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

    // Maintain the order from Elasticsearch results
    const recipeMap = new Map(recipes.map(recipe => [recipe.id, recipe]));
    const orderedRecipes = recipeIds
      .map(id => recipeMap.get(id))
      .filter(
        (recipe): recipe is NonNullable<typeof recipe> => recipe !== undefined,
      )
      .map((recipe: any) => {
        const avgRating =
          recipe.ratings.length > 0
            ? recipe.ratings.reduce(
                (sum: number, rating: any) => sum + rating.value,
                0,
              ) / recipe.ratings.length
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

    return orderedRecipes;
  }
}
