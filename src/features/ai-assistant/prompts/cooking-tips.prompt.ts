export class CookingTipsPrompt {
    static getSystemMessage(): string {
        return `You are a master chef and cooking instructor. Your task is to provide helpful, practical cooking tips based on recipe analysis, cooking techniques, and skill level requirements.

Guidelines for cooking tips:
1. Provide actionable, specific advice
2. Consider the recipe's difficulty level and techniques
3. Include timing and temperature guidance
4. Suggest equipment or tool recommendations
5. Offer troubleshooting advice for common issues
6. Include food safety considerations when relevant
7. Provide tips for ingredient preparation and storage
8. Suggest variations or customizations

Format your response as a JSON object:
{
  "tips": [
    {
      "category": "preparation|cooking|timing|equipment|safety|storage|troubleshooting",
      "tip": "Specific cooking tip",
      "importance": "high|medium|low",
      "skillLevel": "beginner|intermediate|advanced"
    }
  ],
  "keyTechniques": ["List of main cooking techniques used"],
  "commonMistakes": ["Common mistakes to avoid"],
  "successIndicators": ["How to know when the dish is done correctly"]
}`;
    }

    static generatePrompt(recipe: {
        title: string;
        description?: string;
        ingredients: Array<{ name: string; quantity: string; unit: string }>;
        instructions: Array<{ stepNumber: number; instruction: string }>;
        cuisine?: string;
        difficulty?: string;
        cookingTime?: number;
        servings?: number;
    }): string {
        const ingredientsList = recipe.ingredients
            .map(ing => `- ${ing.quantity} ${ing.unit} ${ing.name}`)
            .join('\n');

        const instructionsList = recipe.instructions
            .sort((a, b) => a.stepNumber - b.stepNumber)
            .map(inst => `${inst.stepNumber}. ${inst.instruction}`)
            .join('\n');

        return `Please provide cooking tips and guidance for this recipe:

**Recipe:** ${recipe.title}
**Description:** ${recipe.description || 'No description provided'}
**Cuisine:** ${recipe.cuisine || 'Not specified'}
**Difficulty:** ${recipe.difficulty || 'Not specified'}
**Cooking Time:** ${recipe.cookingTime ? `${recipe.cookingTime} minutes` : 'Not specified'}
**Servings:** ${recipe.servings || 'Not specified'}

**Ingredients:**
${ingredientsList}

**Instructions:**
${instructionsList}

Provide practical cooking tips, technique guidance, and advice to help ensure success with this recipe.`;
    }

    static generateTechniquePrompt(techniques: string[], difficulty: string): string {
        const techniquesList = techniques.join(', ');

        return `Please provide cooking tips for these techniques used in a ${difficulty} difficulty recipe:

**Cooking Techniques:** ${techniquesList}

Focus on:
1. Proper execution of each technique
2. Common mistakes to avoid
3. Equipment recommendations
4. Timing and temperature guidance
5. Visual and sensory cues for success`;
    }

    static generateIngredientTipsPrompt(
        ingredients: Array<{ name: string; quantity: string; unit: string }>,
        cookingMethod: string,
    ): string {
        const ingredientsList = ingredients
            .map(ing => `- ${ing.quantity} ${ing.unit} ${ing.name}`)
            .join('\n');

        return `Please provide ingredient-specific tips for ${cookingMethod}:

**Ingredients:**
${ingredientsList}

**Cooking Method:** ${cookingMethod}

Focus on:
1. Ingredient preparation techniques
2. Quality selection tips
3. Storage and handling advice
4. How each ingredient behaves during cooking
5. Timing for adding ingredients`;
    }

    static generateTroubleshootingPrompt(
        recipeTitle: string,
        commonIssues: string[],
    ): string {
        const issuesList = commonIssues.join(', ');

        return `Please provide troubleshooting advice for common issues with this recipe:

**Recipe:** ${recipeTitle}
**Common Issues:** ${issuesList}

Provide:
1. Why these issues occur
2. How to prevent them
3. How to fix them if they happen
4. Alternative approaches to avoid problems`;
    }

    static generateSkillLevelTipsPrompt(
        recipeTitle: string,
        targetSkillLevel: 'beginner' | 'intermediate' | 'advanced',
    ): string {
        const skillGuidance = {
            beginner: 'Focus on basic techniques, safety, and building confidence',
            intermediate: 'Emphasize technique refinement and flavor development',
            advanced: 'Highlight professional techniques and creative variations',
        };

        return `Please provide cooking tips tailored for ${targetSkillLevel} cooks making this recipe:

**Recipe:** ${recipeTitle}
**Target Skill Level:** ${targetSkillLevel}

**Focus:** ${skillGuidance[targetSkillLevel]}

Provide tips that are appropriate for this skill level, including technique explanations and confidence-building advice.`;
    }
}
