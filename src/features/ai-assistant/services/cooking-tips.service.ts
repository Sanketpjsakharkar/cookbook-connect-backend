import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/core/database';
import { OpenAIService } from '@/core/infrastructure/external-apis/openai';
import { CookingTipsPrompt } from '../prompts/cooking-tips.prompt';

export interface CookingTip {
  category: 'preparation' | 'cooking' | 'timing' | 'equipment' | 'safety' | 'storage' | 'troubleshooting';
  tip: string;
  importance: 'high' | 'medium' | 'low';
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface CookingGuidance {
  tips: CookingTip[];
  keyTechniques: string[];
  commonMistakes: string[];
  successIndicators: string[];
  guidanceId: string;
  recipeId: string;
  createdAt: Date;
}

@Injectable()
export class CookingTipsService {
  private readonly logger = new Logger(CookingTipsService.name);

  constructor(
    private prismaService: PrismaService,
    private openAIService: OpenAIService,
  ) {}

  async getCookingTips(recipeId: string, userId: string): Promise<CookingGuidance | null> {
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
      const cacheKey = `cooking_tips:${recipeId}:${this.getRecipeHash(recipe)}`;

      // Generate AI cooking tips
      const prompt = CookingTipsPrompt.generatePrompt({
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
        servings: recipe.servings || undefined,
      });

      const systemMessage = CookingTipsPrompt.getSystemMessage();

      const aiResponse = await this.openAIService.generateCompletion(
        prompt,
        systemMessage,
        {
          maxTokens: 2000,
          temperature: 0.7,
          cacheKey,
          cacheTTL: 3600, // Cache for 1 hour
        },
      );

      if (!aiResponse) {
        this.logger.warn(`No AI response for cooking tips: ${recipeId}`);
        return null;
      }

      // Parse AI response
      const guidance = this.parseCookingTipsResponse(aiResponse, recipeId);
      if (!guidance) {
        this.logger.warn(`Failed to parse cooking tips response for recipe: ${recipeId}`);
        return null;
      }

      this.logger.debug(`Cooking tips generated for recipe ${recipeId}`);
      return guidance;

    } catch (error) {
      this.logger.error(`Failed to get cooking tips for recipe ${recipeId}:`, error);
      return null;
    }
  }

  async getTechniqueGuidance(
    techniques: string[],
    difficulty: string,
  ): Promise<CookingTip[] | null> {
    try {
      const cacheKey = `technique_guidance:${techniques.sort().join(',')}:${difficulty}`;

      const prompt = CookingTipsPrompt.generateTechniquePrompt(techniques, difficulty);

      const aiResponse = await this.openAIService.generateCompletion(
        prompt,
        CookingTipsPrompt.getSystemMessage(),
        {
          maxTokens: 1500,
          temperature: 0.6,
          cacheKey,
          cacheTTL: 7200, // Cache for 2 hours
        },
      );

      if (!aiResponse) {
        return null;
      }

      // Parse response
      try {
        const parsed = JSON.parse(aiResponse);
        if (parsed.tips && Array.isArray(parsed.tips)) {
          return parsed.tips.map((tip: any) => ({
            category: tip.category || 'cooking',
            tip: tip.tip || '',
            importance: tip.importance || 'medium',
            skillLevel: tip.skillLevel || 'intermediate',
          }));
        }
      } catch {
        // Fallback to text extraction
        return this.extractTipsFromText(aiResponse);
      }

      return null;

    } catch (error) {
      this.logger.error(`Failed to get technique guidance:`, error);
      return null;
    }
  }

  async getIngredientTips(
    ingredients: Array<{ name: string; quantity: string; unit: string }>,
    cookingMethod: string,
  ): Promise<CookingTip[] | null> {
    try {
      const ingredientNames = ingredients.map(ing => ing.name).sort().join(',');
      const cacheKey = `ingredient_tips:${ingredientNames}:${cookingMethod}`;

      const prompt = CookingTipsPrompt.generateIngredientTipsPrompt(ingredients, cookingMethod);

      const aiResponse = await this.openAIService.generateCompletion(
        prompt,
        CookingTipsPrompt.getSystemMessage(),
        {
          maxTokens: 1200,
          temperature: 0.6,
          cacheKey,
          cacheTTL: 3600,
        },
      );

      if (!aiResponse) {
        return null;
      }

      // Parse response
      try {
        const parsed = JSON.parse(aiResponse);
        if (parsed.tips && Array.isArray(parsed.tips)) {
          return parsed.tips;
        }
      } catch {
        return this.extractTipsFromText(aiResponse);
      }

      return null;

    } catch (error) {
      this.logger.error(`Failed to get ingredient tips:`, error);
      return null;
    }
  }

  async getTroubleshootingAdvice(
    recipeTitle: string,
    commonIssues: string[],
  ): Promise<string[] | null> {
    try {
      const cacheKey = `troubleshooting:${recipeTitle}:${commonIssues.sort().join(',')}`;

      const prompt = CookingTipsPrompt.generateTroubleshootingPrompt(recipeTitle, commonIssues);

      const aiResponse = await this.openAIService.generateCompletion(
        prompt,
        'You are a cooking expert providing troubleshooting advice. Be specific and practical.',
        {
          maxTokens: 1000,
          temperature: 0.6,
          cacheKey,
          cacheTTL: 7200,
        },
      );

      if (!aiResponse) {
        return null;
      }

      // Extract advice from response
      const advice = aiResponse
        .split('\n')
        .filter(line => line.trim().length > 20)
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
        .filter(line => line.length > 0)
        .slice(0, 8); // Limit to 8 pieces of advice

      return advice.length > 0 ? advice : null;

    } catch (error) {
      this.logger.error(`Failed to get troubleshooting advice:`, error);
      return null;
    }
  }

  async getSkillLevelTips(
    recipeTitle: string,
    targetSkillLevel: 'beginner' | 'intermediate' | 'advanced',
  ): Promise<CookingTip[] | null> {
    try {
      const cacheKey = `skill_level_tips:${recipeTitle}:${targetSkillLevel}`;

      const prompt = CookingTipsPrompt.generateSkillLevelTipsPrompt(recipeTitle, targetSkillLevel);

      const aiResponse = await this.openAIService.generateCompletion(
        prompt,
        CookingTipsPrompt.getSystemMessage(),
        {
          maxTokens: 1200,
          temperature: 0.7,
          cacheKey,
          cacheTTL: 3600,
        },
      );

      if (!aiResponse) {
        return null;
      }

      // Parse response
      try {
        const parsed = JSON.parse(aiResponse);
        if (parsed.tips && Array.isArray(parsed.tips)) {
          return parsed.tips.map((tip: any) => ({
            category: tip.category || 'cooking',
            tip: tip.tip || '',
            importance: tip.importance || 'medium',
            skillLevel: targetSkillLevel,
          }));
        }
      } catch {
        return this.extractTipsFromText(aiResponse, targetSkillLevel);
      }

      return null;

    } catch (error) {
      this.logger.error(`Failed to get skill level tips:`, error);
      return null;
    }
  }

  async getQuickTips(recipeId: string): Promise<string[] | null> {
    try {
      const recipe = await this.prismaService.recipe.findUnique({
        where: { id: recipeId },
        select: {
          title: true,
          difficulty: true,
          cookingTime: true,
          cuisine: true,
        },
      });

      if (!recipe) {
        return null;
      }

      const cacheKey = `quick_tips:${recipeId}`;

      const prompt = `Provide 3 quick, essential tips for making "${recipe.title}" successfully. 
      Difficulty: ${recipe.difficulty || 'Not specified'}
      Cuisine: ${recipe.cuisine || 'Not specified'}
      
      Focus on the most important things to get right.`;

      const aiResponse = await this.openAIService.generateCompletion(
        prompt,
        'You are a chef providing concise, practical cooking tips. Be brief and specific.',
        {
          maxTokens: 300,
          temperature: 0.8,
          cacheKey,
          cacheTTL: 3600,
        },
      );

      if (!aiResponse) {
        return null;
      }

      const tips = aiResponse
        .split('\n')
        .filter(line => line.trim().length > 10)
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
        .filter(tip => tip.length > 0)
        .slice(0, 3);

      return tips.length > 0 ? tips : null;

    } catch (error) {
      this.logger.error(`Failed to get quick tips for recipe ${recipeId}:`, error);
      return null;
    }
  }

  private parseCookingTipsResponse(response: string, recipeId: string): CookingGuidance | null {
    try {
      const parsed = JSON.parse(response);
      
      if (!parsed.tips || !Array.isArray(parsed.tips)) {
        throw new Error('Invalid response format');
      }

      return {
        tips: parsed.tips.map((tip: any) => ({
          category: tip.category || 'cooking',
          tip: tip.tip || '',
          importance: tip.importance || 'medium',
          skillLevel: tip.skillLevel || 'intermediate',
        })),
        keyTechniques: Array.isArray(parsed.keyTechniques) ? parsed.keyTechniques : [],
        commonMistakes: Array.isArray(parsed.commonMistakes) ? parsed.commonMistakes : [],
        successIndicators: Array.isArray(parsed.successIndicators) ? parsed.successIndicators : [],
        guidanceId: `guidance_${recipeId}_${Date.now()}`,
        recipeId,
        createdAt: new Date(),
      };

    } catch (error) {
      // Fallback: extract tips from text
      this.logger.warn('Failed to parse JSON response, attempting text extraction');
      
      const tips = this.extractTipsFromText(response);
      
      if (tips.length === 0) {
        return null;
      }

      return {
        tips,
        keyTechniques: [],
        commonMistakes: [],
        successIndicators: [],
        guidanceId: `guidance_${recipeId}_${Date.now()}`,
        recipeId,
        createdAt: new Date(),
      };
    }
  }

  private extractTipsFromText(text: string, skillLevel: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'): CookingTip[] {
    const tips: CookingTip[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 20);

    for (const line of lines) {
      const cleanLine = line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').replace(/^•\s*/, '').trim();
      
      if (cleanLine.length > 20) {
        // Determine category based on keywords
        let category: CookingTip['category'] = 'cooking';
        if (cleanLine.toLowerCase().includes('prep') || cleanLine.toLowerCase().includes('mise')) {
          category = 'preparation';
        } else if (cleanLine.toLowerCase().includes('time') || cleanLine.toLowerCase().includes('minute')) {
          category = 'timing';
        } else if (cleanLine.toLowerCase().includes('equipment') || cleanLine.toLowerCase().includes('tool')) {
          category = 'equipment';
        } else if (cleanLine.toLowerCase().includes('safe') || cleanLine.toLowerCase().includes('temperature')) {
          category = 'safety';
        } else if (cleanLine.toLowerCase().includes('store') || cleanLine.toLowerCase().includes('keep')) {
          category = 'storage';
        }

        // Determine importance based on keywords
        let importance: CookingTip['importance'] = 'medium';
        if (cleanLine.toLowerCase().includes('important') || cleanLine.toLowerCase().includes('critical') || cleanLine.toLowerCase().includes('essential')) {
          importance = 'high';
        } else if (cleanLine.toLowerCase().includes('optional') || cleanLine.toLowerCase().includes('nice')) {
          importance = 'low';
        }

        tips.push({
          category,
          tip: cleanLine,
          importance,
          skillLevel,
        });
      }
    }

    return tips.slice(0, 8); // Limit to 8 tips
  }

  private getRecipeHash(recipe: any): string {
    // Create a simple hash based on recipe content for caching
    const content = JSON.stringify({
      title: recipe.title,
      difficulty: recipe.difficulty,
      cookingTime: recipe.cookingTime,
      ingredientCount: recipe.ingredients.length,
      instructionCount: recipe.instructions.length,
    });
    
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(36);
  }
}
