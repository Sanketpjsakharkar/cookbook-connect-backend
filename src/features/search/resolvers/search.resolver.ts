import { Args, Query, Resolver, Int } from '@nestjs/graphql';
import { SearchService } from '../services/search.service';
import { SearchQueryInput } from '../dto/search-query.dto';
import { SearchResult, AutocompleteResult } from '../dto/search-result.dto';
import { Public } from '@/shared/decorators';

@Resolver()
export class SearchResolver {
  constructor(private searchService: SearchService) {}

  @Public()
  @Query(() => SearchResult)
  async searchRecipes(
    @Args('input') searchQuery: SearchQueryInput,
  ): Promise<SearchResult> {
    return this.searchService.searchRecipes(searchQuery);
  }

  @Public()
  @Query(() => SearchResult)
  async cookWithWhatIHave(
    @Args('ingredients', { type: () => [String] }) ingredients: string[],
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
  ): Promise<SearchResult> {
    return this.searchService.cookWithWhatIHave(ingredients, limit);
  }

  @Public()
  @Query(() => AutocompleteResult)
  async autocompleteIngredients(
    @Args('query') query: string,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit: number,
  ): Promise<AutocompleteResult> {
    return this.searchService.autocompleteIngredients(query, limit);
  }
}
