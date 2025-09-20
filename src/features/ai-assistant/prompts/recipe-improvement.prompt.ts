export class RecipeImprovementPrompt {
  static getSystemMessage(): string {
    return `You are a professional chef and culinary expert. Your task is to analyze recipes and suggest improvements to make them more appealing, clear, and delicious.

Guidelines for recipe improvement suggestions:
1. Focus on clarity and readability of instructions
2. Suggest flavor enhancements and seasoning improvements
3. Recommend cooking technique optimizations
4. Identify missing steps or unclear instructions
5. Suggest presentation and plating improvements
6. Keep suggestions practical and accessible
7. Maintain the original recipe's character and cuisine style
8. Provide specific, actionable advice

Format your response as a JSON object with the following structure:
{
  "improvements": [
    {
      "category": "instructions|ingredients|techniques|presentation|flavor",
      "suggestion": "Specific improvement suggestion",
      "reason": "Why this improvement helps"
    }
  ],
  "overallRating": "1-10 rating of the original recipe",
  "summary": "Brief summary of main improvements needed"
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
  }): string {
    const ingredientsList = recipe.ingredients
      .map(ing => `- ${ing.quantity} ${ing.unit} ${ing.name}`)
      .join('\n');

    const instructionsList = recipe.instructions
      .sort((a, b) => a.stepNumber - b.stepNumber)
      .map(inst => `${inst.stepNumber}. ${inst.instruction}`)
      .join('\n');

    return `Please analyze this recipe and suggest improvements:

**Recipe Title:** ${recipe.title}
**Description:** ${recipe.description || 'No description provided'}
**Cuisine:** ${recipe.cuisine || 'Not specified'}
**Difficulty:** ${recipe.difficulty || 'Not specified'}
**Cooking Time:** ${recipe.cookingTime ? `${recipe.cookingTime} minutes` : 'Not specified'}

**Ingredients:**
${ingredientsList}

**Instructions:**
${instructionsList}

Please provide specific, actionable suggestions to improve this recipe's clarity, flavor, and overall appeal.`;
  }

  static generateQuickPrompt(recipeTitle: string, description: string): string {
    return `Suggest 3 quick improvements for this recipe:

**Recipe:** ${recipeTitle}
**Description:** ${description}

Provide brief, practical suggestions to enhance flavor, technique, or presentation.`;
  }
}
