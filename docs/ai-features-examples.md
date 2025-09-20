# AI Features - GraphQL Examples

This document provides example GraphQL queries and mutations for testing AI enhancement features in CookBook Connect.

## Authentication

All AI queries require JWT authentication. Include the authorization header:

```
{
  "authorization": "Bearer YOUR_JWT_TOKEN"
}
```

## Rate Limiting

AI features are rate-limited per user:
- **Hourly Limit**: 50 requests per hour
- **Daily Limit**: 200 requests per day
- **Token Limit**: 100,000 tokens per day

Rate limit headers are included in responses:
- `X-AI-RateLimit-Hourly-Remaining`
- `X-AI-RateLimit-Daily-Remaining`
- `X-AI-Tokens-Daily-Remaining`

## Recipe Analysis

### Analyze Recipe

Get comprehensive AI analysis of a recipe with improvement suggestions:

```graphql
query AnalyzeRecipe($input: RecipeAnalysisInput!) {
  analyzeRecipe(input: $input) {
    analysisId
    recipeId
    improvements {
      category
      suggestion
      reason
    }
    overallRating
    summary
    createdAt
  }
}
```

**Variables:**
```json
{
  "input": {
    "recipeId": "recipe-uuid-here"
  }
}
```

### Quick Suggestions

Get 3 quick improvement suggestions for a recipe:

```graphql
query GetQuickSuggestions($input: QuickSuggestionsInput!) {
  getQuickSuggestions(input: $input)
}
```

**Variables:**
```json
{
  "input": {
    "recipeId": "recipe-uuid-here"
  }
}
```

### Recipe Complexity Analysis

Analyze recipe complexity and skill requirements:

```graphql
query GetRecipeComplexity($recipeId: ID!) {
  getRecipeComplexity(recipeId: $recipeId)
}
```

**Variables:**
```json
{
  "recipeId": "recipe-uuid-here"
}
```

**Response Format:**
```json
{
  "complexity": "simple|moderate|complex",
  "factors": ["List of complexity factors"],
  "estimatedTime": 45,
  "skillLevel": "beginner|intermediate|advanced"
}
```

## Ingredient Substitutions

### Get Recipe Substitutions

Get ingredient substitutions based on dietary restrictions:

```graphql
query GetIngredientSubstitutions($input: SubstitutionRequestInput!) {
  getIngredientSubstitutions(input: $input) {
    requestId
    substitutions {
      original
      substitute
      ratio
      notes
      impact
    }
    overallNotes
    difficultyChange
    createdAt
  }
}
```

**Variables:**
```json
{
  "input": {
    "recipeId": "recipe-uuid-here",
    "restrictions": ["VEGAN", "GLUTEN_FREE"]
  }
}
```

### Single Ingredient Substitution

Get substitutions for a specific ingredient:

```graphql
query GetSingleIngredientSubstitution($input: SingleIngredientSubstitutionInput!) {
  getSingleIngredientSubstitution(input: $input) {
    original
    substitute
    ratio
    notes
    impact
  }
}
```

**Variables:**
```json
{
  "input": {
    "ingredient": "butter",
    "quantity": "1",
    "unit": "cup",
    "reason": "dairy-free diet",
    "recipeType": "baking"
  }
}
```

### Dietary Substitutions

Get substitutions for a specific dietary need:

```graphql
query GetDietarySubstitutions($recipeId: ID!, $dietaryNeed: DietaryRestriction!) {
  getDietarySubstitutions(recipeId: $recipeId, dietaryNeed: $dietaryNeed) {
    requestId
    substitutions {
      original
      substitute
      ratio
      notes
      impact
    }
    overallNotes
    difficultyChange
    createdAt
  }
}
```

**Variables:**
```json
{
  "recipeId": "recipe-uuid-here",
  "dietaryNeed": "KETO"
}
```

### Common Substitutions

Get a list of common ingredient substitutions:

```graphql
query GetCommonSubstitutions {
  getCommonSubstitutions
}
```

## Cooking Tips

### Get Cooking Tips

Get comprehensive cooking guidance for a recipe:

```graphql
query GetCookingTips($input: CookingTipsInput!) {
  getCookingTips(input: $input) {
    guidanceId
    recipeId
    tips {
      category
      tip
      importance
      skillLevel
    }
    keyTechniques
    commonMistakes
    successIndicators
    createdAt
  }
}
```

**Variables:**
```json
{
  "input": {
    "recipeId": "recipe-uuid-here"
  }
}
```

### Technique Guidance

Get tips for specific cooking techniques:

```graphql
query GetTechniqueGuidance($input: TechniqueGuidanceInput!) {
  getTechniqueGuidance(input: $input) {
    category
    tip
    importance
    skillLevel
  }
}
```

**Variables:**
```json
{
  "input": {
    "techniques": ["sautéing", "braising", "emulsifying"],
    "difficulty": "intermediate"
  }
}
```

### Troubleshooting Advice

Get troubleshooting advice for common cooking issues:

```graphql
query GetTroubleshootingAdvice($recipeTitle: String!, $commonIssues: [String!]!) {
  getTroubleshootingAdvice(recipeTitle: $recipeTitle, commonIssues: $commonIssues)
}
```

**Variables:**
```json
{
  "recipeTitle": "Chocolate Soufflé",
  "commonIssues": ["soufflé collapsed", "not rising properly", "too dense"]
}
```

### Quick Tips

Get 3 essential tips for a recipe:

```graphql
query GetQuickTips($recipeId: ID!) {
  getQuickTips(recipeId: $recipeId)
}
```

**Variables:**
```json
{
  "recipeId": "recipe-uuid-here"
}
```

## AI Service Management

### AI Usage Metrics

Get current AI usage statistics:

```graphql
query GetAIUsageMetrics {
  getAIUsageMetrics {
    totalRequests
    totalTokens
    totalCost
    requestsToday
    tokensToday
    costToday
  }
}
```

### AI Service Health

Check if AI service is operational:

```graphql
query IsAIServiceHealthy {
  isAIServiceHealthy
}
```

## Batch Operations (Mutations)

### Generate Recipe Insights

Get comprehensive AI insights for a recipe (analysis + tips + suggestions):

```graphql
mutation GenerateRecipeInsights($recipeId: ID!) {
  generateRecipeInsights(recipeId: $recipeId) {
    type
    success
    message
    data
    responseTime
    cached
    createdAt
  }
}
```

**Variables:**
```json
{
  "recipeId": "recipe-uuid-here"
}
```

### Generate Dietary Alternatives

Get comprehensive dietary substitutions for a recipe:

```graphql
mutation GenerateDietaryAlternatives($recipeId: ID!, $restrictions: [DietaryRestriction!]!) {
  generateDietaryAlternatives(recipeId: $recipeId, restrictions: $restrictions) {
    type
    success
    message
    data
    responseTime
    cached
    createdAt
  }
}
```

**Variables:**
```json
{
  "recipeId": "recipe-uuid-here",
  "restrictions": ["VEGAN", "GLUTEN_FREE"]
}
```

## Available Enums

### DietaryRestriction
- `VEGAN`
- `VEGETARIAN`
- `GLUTEN_FREE`
- `DAIRY_FREE`
- `NUT_FREE`
- `KETO`
- `PALEO`
- `LOW_SODIUM`
- `LOW_SUGAR`
- `HALAL`
- `KOSHER`

### CookingTipCategory
- `PREPARATION`
- `COOKING`
- `TIMING`
- `EQUIPMENT`
- `SAFETY`
- `STORAGE`
- `TROUBLESHOOTING`

### ImportanceLevel
- `HIGH`
- `MEDIUM`
- `LOW`

### SkillLevel
- `BEGINNER`
- `INTERMEDIATE`
- `ADVANCED`

## Error Handling

AI features include graceful error handling:

1. **Service Unavailable**: Returns `null` with logged error
2. **Rate Limit Exceeded**: Returns HTTP 429 with rate limit headers
3. **Invalid Input**: Returns GraphQL validation errors
4. **Timeout**: 5-second timeout with fallback response

## Caching

AI responses are cached to optimize performance and cost:

- **Recipe Analysis**: 2 hours TTL
- **Substitutions**: 1 hour TTL
- **Cooking Tips**: 1 hour TTL
- **Quick Suggestions**: 1 hour TTL
- **Technique Guidance**: 2 hours TTL

Cache keys are based on:
- Recipe content hash
- User input parameters
- Dietary restrictions
- Technique combinations

## Testing Tips

1. **Start with Quick Queries**: Use `getQuickTips` and `getQuickSuggestions` for fast testing
2. **Test Rate Limiting**: Make multiple requests to see rate limit headers
3. **Try Different Restrictions**: Test various dietary restriction combinations
4. **Check Caching**: Run the same query twice to see caching in action
5. **Monitor Usage**: Use `getAIUsageMetrics` to track token consumption

## Performance Expectations

- **Response Time**: < 5 seconds (usually 1-3 seconds)
- **Cache Hit Rate**: ~70% for repeated queries
- **Token Usage**: 200-1500 tokens per request
- **Cost**: ~$0.001-$0.01 per request (depending on complexity)

## Troubleshooting

### Common Issues:

1. **No Response**: Check if OpenAI API key is configured
2. **Rate Limited**: Wait for rate limit reset or upgrade limits
3. **Poor Quality**: Try more specific prompts or different recipe data
4. **Timeout**: Reduce request complexity or check network connectivity

### Debug Information:

Enable debug logging:
```bash
LOG_LEVEL=debug npm run start:dev
```

This shows:
- AI request/response details
- Cache hit/miss information
- Rate limiting decisions
- Token usage tracking
