import { OpenAIModule } from '@/core/infrastructure/external-apis/openai';
import { RedisModule } from '@/core/infrastructure/redis';
import { Module } from '@nestjs/common';
import { AIRateLimitGuard } from './guards/ai-rate-limit.guard';
import { AIResolver } from './resolvers/ai.resolver';
import { CookingTipsService } from './services/cooking-tips.service';
import { IngredientSubstitutionService } from './services/ingredient-substitution.service';
import { RecipeAnalyzerService } from './services/recipe-analyzer.service';

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
export class AIModule { }
