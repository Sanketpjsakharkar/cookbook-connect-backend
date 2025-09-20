import { Module } from '@nestjs/common';
import { OpenAIModule } from '@/core/infrastructure/external-apis/openai';
import { RedisModule } from '@/core/infrastructure/redis';
import { RecipeAnalyzerService } from './services/recipe-analyzer.service';
import { IngredientSubstitutionService } from './services/ingredient-substitution.service';
import { CookingTipsService } from './services/cooking-tips.service';
import { AIResolver } from './resolvers/ai.resolver';
import { AIRateLimitGuard } from './guards/ai-rate-limit.guard';

@Module({
  imports: [OpenAIModule, RedisModule],
  providers: [
    RecipeAnalyzerService,
    IngredientSubstitutionService,
    CookingTipsService,
    AIResolver,
    AIRateLimitGuard,
  ],
  exports: [
    RecipeAnalyzerService,
    IngredientSubstitutionService,
    CookingTipsService,
    AIRateLimitGuard,
  ],
})
export class AIModule {}
