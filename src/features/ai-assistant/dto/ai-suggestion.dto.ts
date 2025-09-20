import { Field, ID, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ArrayMinSize, IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

// Enums
export enum AIRequestType {
    RECIPE_ANALYSIS = 'RECIPE_ANALYSIS',
    INGREDIENT_SUBSTITUTION = 'INGREDIENT_SUBSTITUTION',
    COOKING_TIPS = 'COOKING_TIPS',
    QUICK_SUGGESTIONS = 'QUICK_SUGGESTIONS',
}

export enum DietaryRestriction {
    VEGAN = 'VEGAN',
    VEGETARIAN = 'VEGETARIAN',
    GLUTEN_FREE = 'GLUTEN_FREE',
    DAIRY_FREE = 'DAIRY_FREE',
    NUT_FREE = 'NUT_FREE',
    KETO = 'KETO',
    PALEO = 'PALEO',
    LOW_SODIUM = 'LOW_SODIUM',
    LOW_SUGAR = 'LOW_SUGAR',
    HALAL = 'HALAL',
    KOSHER = 'KOSHER',
}

export enum CookingTipCategory {
    PREPARATION = 'PREPARATION',
    COOKING = 'COOKING',
    TIMING = 'TIMING',
    EQUIPMENT = 'EQUIPMENT',
    SAFETY = 'SAFETY',
    STORAGE = 'STORAGE',
    TROUBLESHOOTING = 'TROUBLESHOOTING',
}

export enum ImportanceLevel {
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW',
}

export enum SkillLevel {
    BEGINNER = 'BEGINNER',
    INTERMEDIATE = 'INTERMEDIATE',
    ADVANCED = 'ADVANCED',
}

// Register enums with GraphQL
registerEnumType(AIRequestType, { name: 'AIRequestType' });
registerEnumType(DietaryRestriction, { name: 'DietaryRestriction' });
registerEnumType(CookingTipCategory, { name: 'CookingTipCategory' });
registerEnumType(ImportanceLevel, { name: 'ImportanceLevel' });
registerEnumType(SkillLevel, { name: 'SkillLevel' });

// Recipe Analysis Types
@ObjectType()
export class RecipeImprovement {
    @Field()
    category: string;

    @Field()
    suggestion: string;

    @Field()
    reason: string;
}

@ObjectType()
export class RecipeAnalysis {
    @Field(() => ID)
    analysisId: string;

    @Field(() => ID)
    recipeId: string;

    @Field(() => [RecipeImprovement])
    improvements: RecipeImprovement[];

    @Field()
    overallRating: number;

    @Field()
    summary: string;

    @Field()
    createdAt: Date;
}

// Ingredient Substitution Types
@ObjectType()
export class IngredientSubstitution {
    @Field()
    original: string;

    @Field()
    substitute: string;

    @Field()
    ratio: string;

    @Field()
    notes: string;

    @Field()
    impact: string;
}

@ObjectType()
export class SubstitutionResult {
    @Field(() => ID)
    requestId: string;

    @Field(() => [IngredientSubstitution])
    substitutions: IngredientSubstitution[];

    @Field()
    overallNotes: string;

    @Field()
    difficultyChange: string;

    @Field()
    createdAt: Date;
}

// Cooking Tips Types
@ObjectType()
export class CookingTip {
    @Field(() => CookingTipCategory)
    category: CookingTipCategory;

    @Field()
    tip: string;

    @Field(() => ImportanceLevel)
    importance: ImportanceLevel;

    @Field(() => SkillLevel)
    skillLevel: SkillLevel;
}

@ObjectType()
export class CookingGuidance {
    @Field(() => ID)
    guidanceId: string;

    @Field(() => ID)
    recipeId: string;

    @Field(() => [CookingTip])
    tips: CookingTip[];

    @Field(() => [String])
    keyTechniques: string[];

    @Field(() => [String])
    commonMistakes: string[];

    @Field(() => [String])
    successIndicators: string[];

    @Field()
    createdAt: Date;
}

// Input Types
@InputType()
export class RecipeAnalysisInput {
    @Field(() => ID)
    @IsString()
    recipeId: string;
}

@InputType()
export class SubstitutionRequestInput {
    @Field(() => ID)
    @IsString()
    recipeId: string;

    @Field(() => [DietaryRestriction])
    @IsArray()
    @ArrayMinSize(1)
    @IsEnum(DietaryRestriction, { each: true })
    restrictions: DietaryRestriction[];
}

@InputType()
export class SingleIngredientSubstitutionInput {
    @Field()
    @IsString()
    ingredient: string;

    @Field()
    @IsString()
    quantity: string;

    @Field()
    @IsString()
    unit: string;

    @Field()
    @IsString()
    reason: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsString()
    recipeType?: string;
}

@InputType()
export class CookingTipsInput {
    @Field(() => ID)
    @IsString()
    recipeId: string;
}

@InputType()
export class TechniqueGuidanceInput {
    @Field(() => [String])
    @IsArray()
    @ArrayMinSize(1)
    techniques: string[];

    @Field()
    @IsString()
    difficulty: string;
}

@InputType()
export class QuickSuggestionsInput {
    @Field(() => ID)
    @IsString()
    recipeId: string;
}

// AI Usage Metrics
@ObjectType()
export class AIUsageMetrics {
    @Field()
    totalRequests: number;

    @Field()
    totalTokens: number;

    @Field()
    totalCost: number;

    @Field()
    requestsToday: number;

    @Field()
    tokensToday: number;

    @Field()
    costToday: number;
}

// Generic AI Response
@ObjectType()
export class AIResponse {
    @Field(() => AIRequestType)
    type: AIRequestType;

    @Field()
    success: boolean;

    @Field({ nullable: true })
    message?: string;

    @Field({ nullable: true })
    data?: string; // JSON string for flexible data

    @Field()
    responseTime: number;

    @Field()
    cached: boolean;

    @Field()
    createdAt: Date;
}
