import { OpenAIService } from '@/core/infrastructure/external-apis/openai';
import { CurrentUser } from '@/shared/decorators';
import { JwtAuthGuard } from '@/shared/guards';
import { Logger, UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
    AIRequestType,
    AIResponse,
    AIUsageMetrics,
    CookingGuidance,
    CookingTip,
    CookingTipsInput,
    DietaryRestriction,
    IngredientSubstitution,
    QuickSuggestionsInput,
    RecipeAnalysis,
    RecipeAnalysisInput,
    SingleIngredientSubstitutionInput,
    SubstitutionRequestInput,
    SubstitutionResult,
    TechniqueGuidanceInput,
} from '../dto/ai-suggestion.dto';
import { CookingTipsService } from '../services/cooking-tips.service';
import { IngredientSubstitutionService } from '../services/ingredient-substitution.service';
import { RecipeAnalyzerService } from '../services/recipe-analyzer.service';

@Resolver()
@UseGuards(JwtAuthGuard)
export class AIResolver {
    private readonly logger = new Logger(AIResolver.name);

    constructor(
        private recipeAnalyzerService: RecipeAnalyzerService,
        private ingredientSubstitutionService: IngredientSubstitutionService,
        private cookingTipsService: CookingTipsService,
        private openAIService: OpenAIService,
    ) { }

    // Recipe Analysis Queries
    @Query(() => RecipeAnalysis, { nullable: true })
    async analyzeRecipe(
        @Args('input') input: RecipeAnalysisInput,
        @CurrentUser() user: any,
    ): Promise<RecipeAnalysis | null> {
        try {
            const startTime = Date.now();
            const analysis = await this.recipeAnalyzerService.analyzeRecipe(input.recipeId, user.id);
            const responseTime = Date.now() - startTime;

            this.logger.debug(`Recipe analysis completed in ${responseTime}ms for recipe ${input.recipeId}`);
            return analysis;
        } catch (error) {
            this.logger.error(`Failed to analyze recipe ${input.recipeId}:`, error);
            return null;
        }
    }

    @Query(() => [String], { nullable: true })
    async getQuickSuggestions(
        @Args('input') input: QuickSuggestionsInput,
        @CurrentUser() user: any,
    ): Promise<string[] | null> {
        try {
            return await this.recipeAnalyzerService.getQuickSuggestions(input.recipeId, user.id);
        } catch (error) {
            this.logger.error(`Failed to get quick suggestions for recipe ${input.recipeId}:`, error);
            return null;
        }
    }

    @Query(() => String, { nullable: true })
    async getRecipeComplexity(
        @Args('recipeId') recipeId: string,
        @CurrentUser() user: any,
    ): Promise<string | null> {
        try {
            const complexity = await this.recipeAnalyzerService.analyzeRecipeComplexity(recipeId);
            return complexity ? JSON.stringify(complexity) : null;
        } catch (error) {
            this.logger.error(`Failed to analyze recipe complexity for ${recipeId}:`, error);
            return null;
        }
    }

    // Ingredient Substitution Queries
    @Query(() => SubstitutionResult, { nullable: true })
    async getIngredientSubstitutions(
        @Args('input') input: SubstitutionRequestInput,
        @CurrentUser() user: any,
    ): Promise<SubstitutionResult | null> {
        try {
            const startTime = Date.now();
            const result = await this.ingredientSubstitutionService.getSubstitutions(
                input.recipeId,
                input.restrictions.map(r => r.toLowerCase()) as any[],
                user.id,
            );
            const responseTime = Date.now() - startTime;

            this.logger.debug(`Substitutions generated in ${responseTime}ms for recipe ${input.recipeId}`);
            return result;
        } catch (error) {
            this.logger.error(`Failed to get substitutions for recipe ${input.recipeId}:`, error);
            return null;
        }
    }

    @Query(() => [IngredientSubstitution], { nullable: true })
    async getSingleIngredientSubstitution(
        @Args('input') input: SingleIngredientSubstitutionInput,
    ): Promise<IngredientSubstitution[] | null> {
        try {
            return await this.ingredientSubstitutionService.getSingleIngredientSubstitution(
                input.ingredient,
                input.quantity,
                input.unit,
                input.reason,
                input.recipeType,
            );
        } catch (error) {
            this.logger.error(`Failed to get single ingredient substitution for ${input.ingredient}:`, error);
            return null;
        }
    }

    @Query(() => SubstitutionResult, { nullable: true })
    async getDietarySubstitutions(
        @Args('recipeId') recipeId: string,
        @Args('dietaryNeed', { type: () => DietaryRestriction }) dietaryNeed: DietaryRestriction,
        @CurrentUser() user: any,
    ): Promise<SubstitutionResult | null> {
        try {
            return await this.ingredientSubstitutionService.getDietarySubstitutions(
                recipeId,
                dietaryNeed.toLowerCase() as any,
                user.id,
            );
        } catch (error) {
            this.logger.error(`Failed to get dietary substitutions for recipe ${recipeId}:`, error);
            return null;
        }
    }

    @Query(() => String, { nullable: true })
    async getCommonSubstitutions(): Promise<string | null> {
        try {
            const substitutions = await this.ingredientSubstitutionService.getCommonSubstitutions();
            return JSON.stringify(substitutions);
        } catch (error) {
            this.logger.error('Failed to get common substitutions:', error);
            return null;
        }
    }

    // Cooking Tips Queries
    @Query(() => CookingGuidance, { nullable: true })
    async getCookingTips(
        @Args('input') input: CookingTipsInput,
        @CurrentUser() user: any,
    ): Promise<CookingGuidance | null> {
        try {
            const startTime = Date.now();
            const guidance = await this.cookingTipsService.getCookingTips(input.recipeId, user.id);
            const responseTime = Date.now() - startTime;

            this.logger.debug(`Cooking tips generated in ${responseTime}ms for recipe ${input.recipeId}`);
            return guidance as any; // Type conversion for enum compatibility
        } catch (error) {
            this.logger.error(`Failed to get cooking tips for recipe ${input.recipeId}:`, error);
            return null;
        }
    }

    @Query(() => [CookingTip], { nullable: true })
    async getTechniqueGuidance(
        @Args('input') input: TechniqueGuidanceInput,
    ): Promise<CookingTip[] | null> {
        try {
            const tips = await this.cookingTipsService.getTechniqueGuidance(
                input.techniques,
                input.difficulty,
            );
            return tips as any; // Type conversion for enum compatibility
        } catch (error) {
            this.logger.error('Failed to get technique guidance:', error);
            return null;
        }
    }

    @Query(() => [String], { nullable: true })
    async getTroubleshootingAdvice(
        @Args('recipeTitle') recipeTitle: string,
        @Args('commonIssues', { type: () => [String] }) commonIssues: string[],
    ): Promise<string[] | null> {
        try {
            return await this.cookingTipsService.getTroubleshootingAdvice(recipeTitle, commonIssues);
        } catch (error) {
            this.logger.error('Failed to get troubleshooting advice:', error);
            return null;
        }
    }

    @Query(() => [String], { nullable: true })
    async getQuickTips(
        @Args('recipeId') recipeId: string,
    ): Promise<string[] | null> {
        try {
            return await this.cookingTipsService.getQuickTips(recipeId);
        } catch (error) {
            this.logger.error(`Failed to get quick tips for recipe ${recipeId}:`, error);
            return null;
        }
    }

    // AI Service Management
    @Query(() => AIUsageMetrics)
    async getAIUsageMetrics(@CurrentUser() user: any): Promise<AIUsageMetrics> {
        try {
            // Only allow admin users to view usage metrics
            // For now, return metrics for all authenticated users
            return await this.openAIService.getUsageMetrics();
        } catch (error) {
            this.logger.error('Failed to get AI usage metrics:', error);
            return {
                totalRequests: 0,
                totalTokens: 0,
                totalCost: 0,
                requestsToday: 0,
                tokensToday: 0,
                costToday: 0,
            };
        }
    }

    @Query(() => Boolean)
    async isAIServiceHealthy(): Promise<boolean> {
        try {
            return await this.openAIService.isHealthy();
        } catch (error) {
            this.logger.error('AI service health check failed:', error);
            return false;
        }
    }

    // Mutations for batch operations
    @Mutation(() => AIResponse)
    async generateRecipeInsights(
        @Args('recipeId') recipeId: string,
        @CurrentUser() user: any,
    ): Promise<AIResponse> {
        const startTime = Date.now();

        try {
            // Generate comprehensive insights for a recipe
            const [analysis, tips, quickSuggestions] = await Promise.allSettled([
                this.recipeAnalyzerService.analyzeRecipe(recipeId, user.id),
                this.cookingTipsService.getCookingTips(recipeId, user.id),
                this.recipeAnalyzerService.getQuickSuggestions(recipeId, user.id),
            ]);

            const insights = {
                analysis: analysis.status === 'fulfilled' ? analysis.value : null,
                tips: tips.status === 'fulfilled' ? tips.value : null,
                quickSuggestions: quickSuggestions.status === 'fulfilled' ? quickSuggestions.value : null,
            };

            const responseTime = Date.now() - startTime;

            return {
                type: AIRequestType.RECIPE_ANALYSIS,
                success: true,
                message: 'Recipe insights generated successfully',
                data: JSON.stringify(insights),
                responseTime,
                cached: false, // This is a composite operation, so not cached
                createdAt: new Date(),
            };

        } catch (error) {
            this.logger.error(`Failed to generate recipe insights for ${recipeId}:`, error);

            return {
                type: AIRequestType.RECIPE_ANALYSIS,
                success: false,
                message: 'Failed to generate recipe insights',
                responseTime: Date.now() - startTime,
                cached: false,
                createdAt: new Date(),
            };
        }
    }

    @Mutation(() => AIResponse)
    async generateDietaryAlternatives(
        @Args('recipeId') recipeId: string,
        @Args('restrictions', { type: () => [DietaryRestriction] }) restrictions: DietaryRestriction[],
        @CurrentUser() user: any,
    ): Promise<AIResponse> {
        const startTime = Date.now();

        try {
            const substitutions = await this.ingredientSubstitutionService.getSubstitutions(
                recipeId,
                restrictions.map(r => r.toLowerCase()) as any[],
                user.id,
            );

            const responseTime = Date.now() - startTime;

            return {
                type: AIRequestType.INGREDIENT_SUBSTITUTION,
                success: !!substitutions,
                message: substitutions ? 'Dietary alternatives generated successfully' : 'Failed to generate alternatives',
                data: substitutions ? JSON.stringify(substitutions) : undefined,
                responseTime,
                cached: false,
                createdAt: new Date(),
            };

        } catch (error) {
            this.logger.error(`Failed to generate dietary alternatives for ${recipeId}:`, error);

            return {
                type: AIRequestType.INGREDIENT_SUBSTITUTION,
                success: false,
                message: 'Failed to generate dietary alternatives',
                responseTime: Date.now() - startTime,
                cached: false,
                createdAt: new Date(),
            };
        }
    }
}
