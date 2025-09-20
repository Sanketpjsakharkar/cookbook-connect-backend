export class SubstitutionPrompt {
    static getSystemMessage(): string {
        return `You are a culinary expert specializing in ingredient substitutions. Your task is to provide accurate, practical substitutions for recipe ingredients based on dietary restrictions, allergies, availability, or preferences.

Guidelines for ingredient substitutions:
1. Maintain the recipe's flavor profile as much as possible
2. Consider texture, moisture, and cooking properties
3. Provide conversion ratios when necessary
4. Explain how the substitution might affect the final dish
5. Offer multiple alternatives when possible
6. Consider common dietary restrictions (gluten-free, dairy-free, vegan, etc.)
7. Suggest readily available alternatives
8. Warn about significant taste or texture changes

Format your response as a JSON object:
{
  "substitutions": [
    {
      "original": "Original ingredient",
      "substitute": "Substitute ingredient",
      "ratio": "Conversion ratio (e.g., 1:1, 1/2 cup for 1 cup)",
      "notes": "Important notes about the substitution",
      "impact": "How this affects taste/texture"
    }
  ],
  "overallNotes": "General notes about the substitutions",
  "difficultyChange": "How substitutions affect recipe difficulty"
}`;
    }

    static generatePrompt(
        ingredients: Array<{ name: string; quantity: string; unit: string }>,
        restrictions: string[],
        recipeContext?: {
            title: string;
            cuisine?: string;
            cookingMethod?: string;
        },
    ): string {
        const ingredientsList = ingredients
            .map(ing => `- ${ing.quantity} ${ing.unit} ${ing.name}`)
            .join('\n');

        const restrictionsList = restrictions.length > 0
            ? restrictions.join(', ')
            : 'No specific restrictions';

        const context = recipeContext
            ? `\n**Recipe Context:**
- Title: ${recipeContext.title}
- Cuisine: ${recipeContext.cuisine || 'Not specified'}
- Cooking Method: ${recipeContext.cookingMethod || 'Not specified'}`
            : '';

        return `Please suggest ingredient substitutions for the following ingredients based on the dietary restrictions provided:

**Ingredients to substitute:**
${ingredientsList}

**Dietary restrictions/preferences:** ${restrictionsList}${context}

Provide practical substitutions that maintain the recipe's integrity while accommodating the specified restrictions.`;
    }

    static generateSingleIngredientPrompt(
        ingredient: string,
        quantity: string,
        unit: string,
        reason: string,
        recipeType?: string,
    ): string {
        const context = recipeType ? ` in a ${recipeType} recipe` : '';

        return `I need a substitution for ${quantity} ${unit} ${ingredient}${context}.

**Reason for substitution:** ${reason}

Please provide 2-3 alternative ingredients with conversion ratios and notes about how they'll affect the final dish.`;
    }

    static generateDietarySubstitutionPrompt(
        ingredients: Array<{ name: string; quantity: string; unit: string }>,
        dietaryNeeds: 'vegan' | 'gluten-free' | 'dairy-free' | 'keto' | 'paleo' | 'low-sodium',
    ): string {
        const ingredientsList = ingredients
            .map(ing => `- ${ing.quantity} ${ing.unit} ${ing.name}`)
            .join('\n');

        const dietaryGuidelines = {
            vegan: 'Replace all animal products (meat, dairy, eggs, honey) with plant-based alternatives',
            'gluten-free': 'Replace wheat, barley, rye, and other gluten-containing ingredients',
            'dairy-free': 'Replace milk, cheese, butter, cream, and other dairy products',
            keto: 'Replace high-carb ingredients with low-carb, high-fat alternatives',
            paleo: 'Replace grains, legumes, dairy, and processed foods with paleo-approved ingredients',
            'low-sodium': 'Replace high-sodium ingredients and seasonings with low-sodium alternatives',
        };

        return `Please convert these ingredients to be ${dietaryNeeds}:

**Original ingredients:**
${ingredientsList}

**Dietary requirement:** ${dietaryGuidelines[dietaryNeeds]}

Provide suitable substitutions that maintain flavor and cooking properties while meeting the ${dietaryNeeds} requirements.`;
    }
}
