import { PrismaService } from '@/core/database';
import { AIService } from '@/core/infrastructure/external-apis/ai';
import { Injectable, Logger } from '@nestjs/common';
import { SubstitutionPrompt } from '../prompts/substitution.prompt';

export interface IngredientSubstitution {
    original: string;
    substitute: string;
    ratio: string;
    notes: string;
    impact: string;
}

export interface SubstitutionResult {
    substitutions: IngredientSubstitution[];
    overallNotes: string;
    difficultyChange: string;
    requestId: string;
    createdAt: Date;
}

export type DietaryRestriction =
    | 'vegan'
    | 'vegetarian'
    | 'gluten-free'
    | 'dairy-free'
    | 'nut-free'
    | 'keto'
    | 'paleo'
    | 'low-sodium'
    | 'low-sugar'
    | 'halal'
    | 'kosher';

@Injectable()
export class IngredientSubstitutionService {
    private readonly logger = new Logger(IngredientSubstitutionService.name);

    constructor(
        private prismaService: PrismaService,
        private aiService: AIService,
    ) { }

    async getSubstitutions(
        recipeId: string,
        restrictions: DietaryRestriction[],
        userId: string,
    ): Promise<SubstitutionResult | null> {
        try {
            // Get recipe with ingredients
            const recipe = await this.prismaService.recipe.findUnique({
                where: { id: recipeId },
                include: {
                    ingredients: {
                        orderBy: { id: 'asc' },
                    },
                },
            });

            if (!recipe) {
                this.logger.warn(`Recipe not found: ${recipeId}`);
                return null;
            }

            // Check permissions
            if (recipe.authorId !== userId && !recipe.isPublic) {
                this.logger.warn(`User ${userId} not authorized to access recipe ${recipeId}`);
                return null;
            }

            // Generate cache key
            const restrictionsKey = restrictions.sort().join(',');
            const cacheKey = `substitutions:${recipeId}:${restrictionsKey}`;

            // Prepare ingredients data
            const ingredients = recipe.ingredients.map(ing => ({
                name: ing.name,
                quantity: ing.quantity.toString(),
                unit: ing.unit,
            }));

            // Generate AI substitution suggestions
            const prompt = SubstitutionPrompt.generatePrompt(
                ingredients,
                restrictions,
                {
                    title: recipe.title,
                    cuisine: recipe.cuisine || undefined,
                },
            );

            const systemMessage = SubstitutionPrompt.getSystemMessage();

            const aiResponse = await this.aiService.generateCompletion(
                prompt,
                systemMessage,
                {
                    maxTokens: 2000,
                    temperature: 0.6,
                    cacheKey,
                    cacheTTL: 3600, // Cache for 1 hour
                },
            );

            if (!aiResponse) {
                this.logger.warn(`No AI response for substitutions: ${recipeId}`);
                return null;
            }

            // Parse AI response
            const result = this.parseSubstitutionResponse(aiResponse, recipeId);
            if (!result) {
                this.logger.warn(`Failed to parse substitution response for recipe: ${recipeId}`);
                return null;
            }

            this.logger.debug(`Substitutions generated for recipe ${recipeId} with restrictions: ${restrictionsKey}`);
            return result;

        } catch (error) {
            this.logger.error(`Failed to get substitutions for recipe ${recipeId}:`, error);
            return null;
        }
    }

    async getSingleIngredientSubstitution(
        ingredient: string,
        quantity: string,
        unit: string,
        reason: string,
        recipeType?: string,
    ): Promise<IngredientSubstitution[] | null> {
        try {
            const cacheKey = `single_substitution:${ingredient}:${reason}:${recipeType || 'general'}`;

            const prompt = SubstitutionPrompt.generateSingleIngredientPrompt(
                ingredient,
                quantity,
                unit,
                reason,
                recipeType,
            );

            const aiResponse = await this.aiService.generateCompletion(
                prompt,
                SubstitutionPrompt.getSystemMessage(),
                {
                    maxTokens: 800,
                    temperature: 0.6,
                    cacheKey,
                    cacheTTL: 7200, // Cache for 2 hours
                },
            );

            if (!aiResponse) {
                return null;
            }

            // Try to parse as JSON first
            try {
                const parsed = JSON.parse(aiResponse);
                if (parsed.substitutions && Array.isArray(parsed.substitutions)) {
                    return parsed.substitutions;
                }
            } catch {
                // Fallback to text parsing
            }

            // Fallback: extract substitutions from text
            return this.extractSubstitutionsFromText(aiResponse, ingredient);

        } catch (error) {
            this.logger.error(`Failed to get single ingredient substitution for ${ingredient}:`, error);
            return null;
        }
    }

    async getDietarySubstitutions(
        recipeId: string,
        dietaryNeed: DietaryRestriction,
        userId: string,
    ): Promise<SubstitutionResult | null> {
        try {
            const recipe = await this.prismaService.recipe.findUnique({
                where: { id: recipeId },
                include: {
                    ingredients: {
                        orderBy: { id: 'asc' },
                    },
                },
            });

            if (!recipe) {
                return null;
            }

            // Check permissions
            if (recipe.authorId !== userId && !recipe.isPublic) {
                return null;
            }

            const cacheKey = `dietary_substitutions:${recipeId}:${dietaryNeed}`;

            const ingredients = recipe.ingredients.map(ing => ({
                name: ing.name,
                quantity: ing.quantity.toString(),
                unit: ing.unit,
            }));

            const prompt = SubstitutionPrompt.generateDietarySubstitutionPrompt(
                ingredients,
                dietaryNeed as any,
            );

            const aiResponse = await this.aiService.generateCompletion(
                prompt,
                SubstitutionPrompt.getSystemMessage(),
                {
                    maxTokens: 2000,
                    temperature: 0.6,
                    cacheKey,
                    cacheTTL: 3600,
                },
            );

            if (!aiResponse) {
                return null;
            }

            const result = this.parseSubstitutionResponse(aiResponse, recipeId);
            return result;

        } catch (error) {
            this.logger.error(`Failed to get dietary substitutions for recipe ${recipeId}:`, error);
            return null;
        }
    }

    async getCommonSubstitutions(): Promise<Record<string, IngredientSubstitution[]>> {
        // Return cached common substitutions for frequently requested ingredients
        const commonSubstitutions: Record<string, IngredientSubstitution[]> = {
            'butter': [
                {
                    original: 'butter',
                    substitute: 'coconut oil',
                    ratio: '1:1',
                    notes: 'Use solid coconut oil for best results',
                    impact: 'Slight coconut flavor, similar texture',
                },
                {
                    original: 'butter',
                    substitute: 'olive oil',
                    ratio: '3/4 cup oil for 1 cup butter',
                    notes: 'Best for savory dishes',
                    impact: 'Different texture, more liquid',
                },
            ],
            'eggs': [
                {
                    original: 'eggs',
                    substitute: 'flax eggs',
                    ratio: '1 tbsp ground flaxseed + 3 tbsp water per egg',
                    notes: 'Let sit for 5 minutes to thicken',
                    impact: 'Slightly nutty flavor, good binding',
                },
                {
                    original: 'eggs',
                    substitute: 'applesauce',
                    ratio: '1/4 cup per egg',
                    notes: 'Best for moist baked goods',
                    impact: 'Adds sweetness and moisture',
                },
            ],
            'milk': [
                {
                    original: 'milk',
                    substitute: 'almond milk',
                    ratio: '1:1',
                    notes: 'Use unsweetened for savory dishes',
                    impact: 'Slightly nutty flavor, thinner consistency',
                },
                {
                    original: 'milk',
                    substitute: 'oat milk',
                    ratio: '1:1',
                    notes: 'Creamy texture, neutral flavor',
                    impact: 'Similar consistency to dairy milk',
                },
            ],
        };

        return commonSubstitutions;
    }

    private parseSubstitutionResponse(response: string, recipeId: string): SubstitutionResult | null {
        try {
            const parsed = JSON.parse(response);

            if (!parsed.substitutions || !Array.isArray(parsed.substitutions)) {
                throw new Error('Invalid response format');
            }

            return {
                substitutions: parsed.substitutions.map((sub: any) => ({
                    original: sub.original || '',
                    substitute: sub.substitute || '',
                    ratio: sub.ratio || '1:1',
                    notes: sub.notes || '',
                    impact: sub.impact || '',
                })),
                overallNotes: parsed.overallNotes || '',
                difficultyChange: parsed.difficultyChange || 'No significant change',
                requestId: `substitution_${recipeId}_${Date.now()}`,
                createdAt: new Date(),
            };

        } catch {
            // Fallback: extract substitutions from text
            this.logger.warn('Failed to parse JSON response, attempting text extraction');

            const substitutions = this.extractSubstitutionsFromText(response);

            if (substitutions.length === 0) {
                return null;
            }

            return {
                substitutions,
                overallNotes: 'Substitutions extracted from text response',
                difficultyChange: 'No significant change',
                requestId: `substitution_${recipeId}_${Date.now()}`,
                createdAt: new Date(),
            };
        }
    }

    private extractSubstitutionsFromText(text: string, originalIngredient?: string): IngredientSubstitution[] {
        const substitutions: IngredientSubstitution[] = [];
        const lines = text.split('\n').filter(line => line.trim().length > 0);

        for (const line of lines) {
            // Look for patterns like "Instead of X, use Y" or "Replace X with Y"
            const patterns = [
                /(?:instead of|replace)\s+([^,]+),?\s+(?:use|with)\s+([^.]+)/i,
                /([^:]+):\s*([^.]+)/,
                /•\s*([^:]+):\s*([^.]+)/,
                /-\s*([^:]+):\s*([^.]+)/,
            ];

            for (const pattern of patterns) {
                const match = line.match(pattern);
                if (match) {
                    substitutions.push({
                        original: originalIngredient || match[1]?.trim() || '',
                        substitute: match[2]?.trim() || '',
                        ratio: '1:1',
                        notes: 'Extracted from AI response',
                        impact: 'See AI response for details',
                    });
                    break;
                }
            }
        }

        return substitutions.slice(0, 5); // Limit to 5 substitutions
    }
}
