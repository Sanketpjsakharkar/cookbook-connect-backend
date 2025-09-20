import { PrismaService } from '@/core/database';
import { OpenAIService } from '@/core/infrastructure/external-apis/openai';
import { Injectable, Logger } from '@nestjs/common';
import { RecipeImprovementPrompt } from '../prompts/recipe-improvement.prompt';

export interface RecipeImprovement {
    category: 'instructions' | 'ingredients' | 'techniques' | 'presentation' | 'flavor';
    suggestion: string;
    reason: string;
}

export interface RecipeAnalysis {
    improvements: RecipeImprovement[];
    overallRating: number;
    summary: string;
    analysisId: string;
    recipeId: string;
    createdAt: Date;
}

@Injectable()
export class RecipeAnalyzerService {
    private readonly logger = new Logger(RecipeAnalyzerService.name);

    constructor(
        private prismaService: PrismaService,
        private openAIService: OpenAIService,
    ) { }

    async analyzeRecipe(recipeId: string, userId: string): Promise<RecipeAnalysis | null> {
        try {
            // Get recipe with all details
            const recipe = await this.prismaService.recipe.findUnique({
                where: { id: recipeId },
                include: {
                    ingredients: {
                        orderBy: { id: 'asc' },
                    },
                    instructions: {
                        orderBy: { stepNumber: 'asc' },
                    },
                    author: {
                        select: { id: true, username: true },
                    },
                },
            });

            if (!recipe) {
                this.logger.warn(`Recipe not found: ${recipeId}`);
                return null;
            }

            // Check if user has permission to analyze this recipe
            if (recipe.authorId !== userId && !recipe.isPublic) {
                this.logger.warn(`User ${userId} not authorized to analyze recipe ${recipeId}`);
                return null;
            }

            // Generate cache key for this analysis
            const cacheKey = `recipe_analysis:${recipeId}:${this.getRecipeHash(recipe)}`;

            // Generate AI analysis
            const prompt = RecipeImprovementPrompt.generatePrompt({
                title: recipe.title,
                description: recipe.description || undefined,
                ingredients: recipe.ingredients.map(ing => ({
                    name: ing.name,
                    quantity: ing.quantity.toString(),
                    unit: ing.unit,
                })),
                instructions: recipe.instructions.map(inst => ({
                    stepNumber: inst.stepNumber,
                    instruction: inst.description,
                })),
                cuisine: recipe.cuisine || undefined,
                difficulty: recipe.difficulty || undefined,
                cookingTime: recipe.cookingTime || undefined,
            });

            const systemMessage = RecipeImprovementPrompt.getSystemMessage();

            const aiResponse = await this.openAIService.generateCompletion(
                prompt,
                systemMessage,
                {
                    maxTokens: 1500,
                    temperature: 0.7,
                    cacheKey,
                    cacheTTL: 7200, // Cache for 2 hours
                },
            );

            if (!aiResponse) {
                this.logger.warn(`No AI response for recipe analysis: ${recipeId}`);
                return null;
            }

            // Parse AI response
            const analysis = this.parseAnalysisResponse(aiResponse, recipeId);
            if (!analysis) {
                this.logger.warn(`Failed to parse AI analysis response for recipe: ${recipeId}`);
                return null;
            }

            // Log successful analysis
            this.logger.debug(`Recipe analysis completed for ${recipeId}`);

            return analysis;

        } catch (error) {
            this.logger.error(`Failed to analyze recipe ${recipeId}:`, error);
            return null;
        }
    }

    async getQuickSuggestions(recipeId: string, userId: string): Promise<string[] | null> {
        try {
            const recipe = await this.prismaService.recipe.findUnique({
                where: { id: recipeId },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    authorId: true,
                    isPublic: true,
                },
            });

            if (!recipe) {
                return null;
            }

            // Check permissions
            if (recipe.authorId !== userId && !recipe.isPublic) {
                return null;
            }

            const cacheKey = `quick_suggestions:${recipeId}`;

            const prompt = RecipeImprovementPrompt.generateQuickPrompt(
                recipe.title,
                recipe.description || 'No description provided',
            );

            const aiResponse = await this.openAIService.generateCompletion(
                prompt,
                'You are a chef providing quick recipe improvement tips. Respond with 3 brief, practical suggestions as a simple list.',
                {
                    maxTokens: 300,
                    temperature: 0.8,
                    cacheKey,
                    cacheTTL: 3600, // Cache for 1 hour
                },
            );

            if (!aiResponse) {
                return null;
            }

            // Parse response into suggestions array
            const suggestions = aiResponse
                .split('\n')
                .filter(line => line.trim().length > 0)
                .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
                .filter(suggestion => suggestion.length > 10) // Filter out very short suggestions
                .slice(0, 3); // Limit to 3 suggestions

            return suggestions.length > 0 ? suggestions : null;

        } catch (error) {
            this.logger.error(`Failed to get quick suggestions for recipe ${recipeId}:`, error);
            return null;
        }
    }

    async analyzeRecipeComplexity(recipeId: string): Promise<{
        complexity: 'simple' | 'moderate' | 'complex';
        factors: string[];
        estimatedTime: number;
        skillLevel: 'beginner' | 'intermediate' | 'advanced';
    } | null> {
        try {
            const recipe = await this.prismaService.recipe.findUnique({
                where: { id: recipeId },
                include: {
                    ingredients: true,
                    instructions: true,
                },
            });

            if (!recipe) {
                return null;
            }

            const factors: string[] = [];
            let complexityScore = 0;

            // Analyze ingredient count
            const ingredientCount = recipe.ingredients.length;
            if (ingredientCount > 15) {
                complexityScore += 2;
                factors.push('High number of ingredients');
            } else if (ingredientCount > 8) {
                complexityScore += 1;
                factors.push('Moderate number of ingredients');
            }

            // Analyze instruction count and complexity
            const instructionCount = recipe.instructions.length;
            if (instructionCount > 12) {
                complexityScore += 2;
                factors.push('Many cooking steps');
            } else if (instructionCount > 6) {
                complexityScore += 1;
                factors.push('Multiple cooking steps');
            }

            // Analyze cooking techniques (basic keyword detection)
            const allInstructions = recipe.instructions
                .map(inst => inst.description.toLowerCase())
                .join(' ');

            const complexTechniques = [
                'braise', 'confit', 'sous vide', 'flambé', 'tempering',
                'emulsify', 'clarify', 'reduce', 'caramelize', 'deglaze',
            ];

            const foundComplexTechniques = complexTechniques.filter(technique =>
                allInstructions.includes(technique),
            );

            if (foundComplexTechniques.length > 0) {
                complexityScore += foundComplexTechniques.length;
                factors.push(`Advanced techniques: ${foundComplexTechniques.join(', ')}`);
            }

            // Analyze timing requirements
            const cookingTime = recipe.cookingTime || 0;
            if (cookingTime > 120) {
                complexityScore += 2;
                factors.push('Long cooking time required');
            } else if (cookingTime > 60) {
                complexityScore += 1;
                factors.push('Moderate cooking time');
            }

            // Determine complexity level
            let complexity: 'simple' | 'moderate' | 'complex';
            let skillLevel: 'beginner' | 'intermediate' | 'advanced';

            if (complexityScore <= 2) {
                complexity = 'simple';
                skillLevel = 'beginner';
            } else if (complexityScore <= 5) {
                complexity = 'moderate';
                skillLevel = 'intermediate';
            } else {
                complexity = 'complex';
                skillLevel = 'advanced';
            }

            // Estimate total time (cooking + prep)
            const estimatedPrepTime = Math.max(15, ingredientCount * 3 + instructionCount * 2);
            const estimatedTime = cookingTime + estimatedPrepTime;

            return {
                complexity,
                factors,
                estimatedTime,
                skillLevel,
            };

        } catch (error) {
            this.logger.error(`Failed to analyze recipe complexity for ${recipeId}:`, error);
            return null;
        }
    }

    private parseAnalysisResponse(response: string, recipeId: string): RecipeAnalysis | null {
        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(response);

            if (!parsed.improvements || !Array.isArray(parsed.improvements)) {
                throw new Error('Invalid response format');
            }

            return {
                improvements: parsed.improvements.map((imp: any) => ({
                    category: imp.category || 'general',
                    suggestion: imp.suggestion || '',
                    reason: imp.reason || '',
                })),
                overallRating: parseInt(parsed.overallRating) || 5,
                summary: parsed.summary || 'Analysis completed',
                analysisId: `analysis_${recipeId}_${Date.now()}`,
                recipeId,
                createdAt: new Date(),
            };

        } catch (error) {
            // Fallback: try to extract suggestions from plain text
            this.logger.warn('Failed to parse JSON response, attempting text extraction');

            const suggestions = response
                .split('\n')
                .filter(line => line.trim().length > 20)
                .map(line => line.trim())
                .slice(0, 5); // Limit to 5 suggestions

            if (suggestions.length === 0) {
                return null;
            }

            return {
                improvements: suggestions.map(suggestion => ({
                    category: 'instructions' as const,
                    suggestion,
                    reason: 'AI-generated suggestion',
                })),
                overallRating: 5,
                summary: 'Analysis completed with text extraction',
                analysisId: `analysis_${recipeId}_${Date.now()}`,
                recipeId,
                createdAt: new Date(),
            };
        }
    }

    private getRecipeHash(recipe: any): string {
        // Create a simple hash based on recipe content for caching
        const content = JSON.stringify({
            title: recipe.title,
            description: recipe.description,
            ingredients: recipe.ingredients.map((ing: any) => `${ing.name}${ing.quantity}${ing.unit}`),
            instructions: recipe.instructions.map((inst: any) => inst.instruction),
        });

        // Simple hash function
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }

        return Math.abs(hash).toString(36);
    }
}
