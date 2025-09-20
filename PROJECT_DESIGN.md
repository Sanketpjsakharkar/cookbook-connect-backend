# CookBook Connect - Backend Design & Ruleset

## Section 1: Design Summary

CookBook Connect is a recipe sharing platform that enables users to upload recipes, discover dishes based on available ingredients, and connect with cooking enthusiasts. The backend serves as a comprehensive GraphQL API built with NestJS and TypeScript, managing complex relationships between users, recipes, ingredients, ratings, and social interactions.

The system integrates multiple technologies: PostgreSQL with Prisma ORM for relational data, Elasticsearch for fast ingredient-based search, Redis for real-time notifications and caching, and OpenAI for AI-powered recipe suggestions. The architecture emphasizes performance (GraphQL queries <200ms, search <100ms), scalability through proper indexing and caching, and real-time features via GraphQL subscriptions for live updates on ratings, comments, and user activities.

## Section 2: Folder Structure

```
src/
├── app.module.ts
├── main.ts
├── shared/                              # Shared utilities and common code
│   ├── constants/
│   │   ├── index.ts
│   │   ├── error-codes.ts
│   │   ├── cache-keys.ts
│   │   └── validation-messages.ts
│   ├── decorators/
│   │   ├── index.ts
│   │   ├── current-user.decorator.ts
│   │   ├── roles.decorator.ts
│   │   └── field-validation.decorator.ts
│   ├── enums/
│   │   ├── index.ts
│   │   ├── user-role.enum.ts
│   │   ├── recipe-difficulty.enum.ts
│   │   └── cuisine-type.enum.ts
│   ├── exceptions/
│   │   ├── index.ts
│   │   ├── base.exception.ts
│   │   ├── business-logic.exception.ts
│   │   └── external-service.exception.ts
│   ├── filters/
│   │   ├── index.ts
│   │   ├── global-exception.filter.ts
│   │   └── graphql-exception.filter.ts
│   ├── guards/
│   │   ├── index.ts
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   └── rate-limit.guard.ts
│   ├── interceptors/
│   │   ├── index.ts
│   │   ├── logging.interceptor.ts
│   │   ├── caching.interceptor.ts
│   │   └── transform.interceptor.ts
│   ├── pipes/
│   │   ├── index.ts
│   │   ├── validation.pipe.ts
│   │   └── parse-objectid.pipe.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── graphql.types.ts
│   │   ├── jwt-payload.type.ts
│   │   └── pagination.types.ts
│   └── utils/
│       ├── index.ts
│       ├── password.util.ts
│       ├── pagination.util.ts
│       ├── date.util.ts
│       └── validation.util.ts
├── core/                                # Core business infrastructure
│   ├── config/
│   │   ├── index.ts
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── elasticsearch.config.ts
│   │   ├── redis.config.ts
│   │   ├── jwt.config.ts
│   │   └── openai.config.ts
│   ├── database/
│   │   ├── index.ts
│   │   ├── database.module.ts
│   │   ├── prisma.service.ts
│   │   ├── migrations/
│   │   └── seeds/
│   │       ├── users.seed.ts
│   │       ├── recipes.seed.ts
│   │       └── ingredients.seed.ts
│   └── infrastructure/
│       ├── elasticsearch/
│       │   ├── elasticsearch.module.ts
│       │   ├── elasticsearch.service.ts
│       │   └── indices/
│       │       ├── recipe.index.ts
│       │       └── ingredient.index.ts
│       ├── redis/
│       │   ├── redis.module.ts
│       │   ├── redis.service.ts
│       │   └── pubsub.service.ts
│       └── external-apis/
│           ├── openai/
│           │   ├── openai.module.ts
│           │   ├── openai.service.ts
│           │   └── dto/
│           └── image-storage/
│               ├── storage.module.ts
│               └── storage.service.ts
├── features/                            # Feature modules (business domains)
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── controllers/
│   │   ├── resolvers/
│   │   │   └── auth.resolver.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── token.service.ts
│   │   │   └── password-reset.service.ts
│   │   ├── guards/
│   │   │   └── local-auth.guard.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   ├── register.dto.ts
│   │   │   └── refresh-token.dto.ts
│   │   └── interfaces/
│   │       └── jwt-payload.interface.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── resolvers/
│   │   │   ├── users.resolver.ts
│   │   │   └── user-profile.resolver.ts
│   │   ├── services/
│   │   │   ├── users.service.ts
│   │   │   ├── user-profile.service.ts
│   │   │   └── user-preferences.service.ts
│   │   ├── repositories/
│   │   │   ├── users.repository.ts
│   │   │   └── user-profile.repository.ts
│   │   ├── entities/
│   │   │   ├── user.entity.ts
│   │   │   └── user-profile.entity.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   ├── update-user.dto.ts
│   │   │   └── user-filter.dto.ts
│   │   └── interfaces/
│   │       └── user-preferences.interface.ts
│   ├── recipes/
│   │   ├── recipes.module.ts
│   │   ├── resolvers/
│   │   │   ├── recipes.resolver.ts
│   │   │   ├── recipe-ingredients.resolver.ts
│   │   │   └── recipe-instructions.resolver.ts
│   │   ├── services/
│   │   │   ├── recipes.service.ts
│   │   │   ├── recipe-validation.service.ts
│   │   │   ├── recipe-analytics.service.ts
│   │   │   └── recipe-recommendations.service.ts
│   │   ├── repositories/
│   │   │   ├── recipes.repository.ts
│   │   │   ├── ingredients.repository.ts
│   │   │   └── instructions.repository.ts
│   │   ├── entities/
│   │   │   ├── recipe.entity.ts
│   │   │   ├── ingredient.entity.ts
│   │   │   └── instruction.entity.ts
│   │   ├── dto/
│   │   │   ├── create-recipe.dto.ts
│   │   │   ├── update-recipe.dto.ts
│   │   │   ├── recipe-filter.dto.ts
│   │   │   └── recipe-search.dto.ts
│   │   └── interfaces/
│   │       ├── recipe-analytics.interface.ts
│   │       └── recipe-suggestion.interface.ts
│   ├── social/                          # Social features (ratings, comments, follows)
│   │   ├── social.module.ts
│   │   ├── resolvers/
│   │   │   ├── ratings.resolver.ts
│   │   │   ├── comments.resolver.ts
│   │   │   └── follows.resolver.ts
│   │   ├── services/
│   │   │   ├── ratings.service.ts
│   │   │   ├── comments.service.ts
│   │   │   ├── follows.service.ts
│   │   │   └── social-feed.service.ts
│   │   ├── repositories/
│   │   │   ├── ratings.repository.ts
│   │   │   ├── comments.repository.ts
│   │   │   └── follows.repository.ts
│   │   ├── entities/
│   │   │   ├── rating.entity.ts
│   │   │   ├── comment.entity.ts
│   │   │   └── follow.entity.ts
│   │   ├── dto/
│   │   │   ├── create-rating.dto.ts
│   │   │   ├── create-comment.dto.ts
│   │   │   └── social-feed.dto.ts
│   │   └── interfaces/
│   │       └── social-activity.interface.ts
│   ├── search/
│   │   ├── search.module.ts
│   │   ├── resolvers/
│   │   │   └── search.resolver.ts
│   │   ├── services/
│   │   │   ├── search.service.ts
│   │   │   ├── elasticsearch-sync.service.ts
│   │   │   └── autocomplete.service.ts
│   │   ├── dto/
│   │   │   ├── search-query.dto.ts
│   │   │   ├── search-filter.dto.ts
│   │   │   └── search-result.dto.ts
│   │   ├── interfaces/
│   │   │   ├── search-query.interface.ts
│   │   │   └── search-result.interface.ts
│   │   └── mappings/
│   │       └── recipe.mapping.ts
│   ├── notifications/                   # Real-time notifications & subscriptions
│   │   ├── notifications.module.ts
│   │   ├── resolvers/
│   │   │   ├── notifications.resolver.ts
│   │   │   └── subscriptions.resolver.ts
│   │   ├── services/
│   │   │   ├── notifications.service.ts
│   │   │   ├── subscription-manager.service.ts
│   │   │   └── push-notification.service.ts
│   │   ├── dto/
│   │   │   ├── notification.dto.ts
│   │   │   └── subscription-filter.dto.ts
│   │   ├── events/
│   │   │   ├── recipe-created.event.ts
│   │   │   ├── rating-added.event.ts
│   │   │   └── comment-added.event.ts
│   │   └── interfaces/
│   │       ├── notification.interface.ts
│   │       └── subscription.interface.ts
│   ├── ai-assistant/
│   │   ├── ai.module.ts
│   │   ├── resolvers/
│   │   │   └── ai.resolver.ts
│   │   ├── services/
│   │   │   ├── ai.service.ts
│   │   │   ├── recipe-analyzer.service.ts
│   │   │   ├── ingredient-substitution.service.ts
│   │   │   └── cooking-tips.service.ts
│   │   ├── dto/
│   │   │   ├── ai-suggestion.dto.ts
│   │   │   ├── ingredient-substitution.dto.ts
│   │   │   └── cooking-tip.dto.ts
│   │   ├── interfaces/
│   │   │   ├── ai-request.interface.ts
│   │   │   └── ai-response.interface.ts
│   │   └── prompts/
│   │       ├── recipe-improvement.prompt.ts
│   │       ├── substitution.prompt.ts
│   │       └── cooking-tips.prompt.ts
│   └── analytics/                       # Usage analytics and metrics
│       ├── analytics.module.ts
│       ├── services/
│       │   ├── analytics.service.ts
│       │   ├── user-behavior.service.ts
│       │   └── recipe-performance.service.ts
│       ├── dto/
│       │   └── analytics-query.dto.ts
│       └── interfaces/
│           └── analytics-data.interface.ts
├── middleware/                          # Custom middleware
│   ├── cors.middleware.ts
│   ├── helmet.middleware.ts
│   └── request-logging.middleware.ts
├── health/                             # Health checks
│   ├── health.module.ts
│   ├── health.controller.ts
│   ├── health.service.ts
│   └── indicators/
│       ├── database.indicator.ts
│       ├── elasticsearch.indicator.ts
│       └── redis.indicator.ts
├── graphql/
│   ├── schema.gql                      # Auto-generated schema
│   ├── scalars/
│   │   ├── date.scalar.ts
│   │   └── json.scalar.ts
│   └── plugins/
│       ├── complexity.plugin.ts
│       └── depth-limit.plugin.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
└── test/
    ├── fixtures/
    │   ├── users.fixture.ts
    │   ├── recipes.fixture.ts
    │   └── ratings.fixture.ts
    ├── helpers/
    │   ├── test-utils.ts
    │   ├── graphql-client.ts
    │   └── mock-services.ts
    ├── unit/
    │   ├── users/
    │   ├── recipes/
    │   └── social/
    ├── integration/
    │   ├── auth.integration.spec.ts
    │   ├── recipes.integration.spec.ts
    │   └── search.integration.spec.ts
    └── e2e/
        ├── user-journey.e2e.spec.ts
        ├── recipe-crud.e2e.spec.ts
        └── social-features.e2e.spec.ts
```

## Section 3: Ruleset / Guidelines

### TypeScript & Code Quality

- **Strict TypeScript**: Enable `"strict": true` in tsconfig.json. Avoid `any` type.
- **Layered Architecture**: modules → resolvers → services → repositories → utils
- **Separation of Concerns**: Prisma client only in repository layer, business logic in services
- **ESLint + Prettier**: Enforce via pre-commit hooks (husky + lint-staged)
- **Import Organization**: Group imports (external, internal, relative) with proper ordering

### GraphQL Best Practices

- **Input Types**: Use dedicated input types for mutations (CreateRecipeInput, UpdateRecipeInput)
- **Pagination**: Implement cursor-based pagination for list queries, provide total counts only when requested
- **N+1 Prevention**: Use Prisma include/select + DataLoader pattern for relationships
- **Field Exposure**: Recipe must expose: id, title, description, ingredients, instructions, avgRating, commentsCount, createdAt, updatedAt
- **Validation**: Use class-validator for inputs or custom validation pipes

### Database & Prisma Rules

- **Schema Design**: Model User, Recipe, Ingredient, Instruction, Rating, Comment, Follow relationships
- **Indexing**: Add indices for common queries (recipe title, user_id, createdAt, rating aggregates)
- **Constraints**: Enforce ingredient quantity + unit requirements, unique username/email
- **Migrations**: Keep migrations tidy and reversible via Prisma Migrate
- **Repository Pattern**: Prisma client access only through repository layer

### Search & Elasticsearch

- **Index Structure**: Index recipes with nested ingredients and metadata (cuisine, difficulty, time)
- **Search Features**: Ingredient-based search with partial-match and fuzzy fallback
- **Ranking**: exact ingredient match → ingredient count → avg rating → recency
- **Sync Strategy**: Update ES index in same transaction or via reliable event pattern
- **Autocomplete**: Implement suggest API for ingredient autocomplete

### Real-time & Caching

- **Technology**: Use Redis Pub/Sub for notifications and live feeds
- **Authentication**: GraphQL Subscriptions must authenticate users via JWT in connectionParams
- **Event Publishing**: Publish events after DB commit for eventual consistency
- **Debouncing**: Implement debounce/throttle to prevent client flooding
- **Caching**: Cache hot data (recipe details, AI suggestions, search autocomplete)

### AI Integration

- **Trigger**: AI calls only for explicit user requests ("Suggest improvements", "Substitute eggs")
- **Caching**: Cache responses by (recipeId/hash, prompt-type, userId) with configurable TTL
- **Rate Limiting**: Limit tokens/cost per request with safe fallbacks
- **Privacy**: Sanitize prompts, avoid sending sensitive user info
- **Monitoring**: Log usage metrics and costs

### Security & Authentication

- **JWT**: Use JWT with refresh tokens, protect mutations, allow public reads with rate limiting
- **Input Validation**: Validate and sanitize all inputs, use parameterized queries
- **Rate Limiting**: Apply to public endpoints and search API
- **Secrets Management**: Environment variables only, no hardcoded secrets
- **Error Handling**: Use Apollo error codes, don't leak stack traces

### Performance & Monitoring

- **Response Times**: GraphQL queries <200ms, search queries <100ms
- **Logging**: Structured logging with proper levels
- **Health Checks**: Implement health and readiness endpoints
- **Metrics**: Prometheus-friendly metrics for monitoring
- **Graceful Degradation**: Return cached data or helpful errors on external service failures

### Testing Requirements

- **Unit Tests**: Services and core business logic
- **Integration Tests**: Resolver integration tests for important flows
- **E2E Tests**: Complete user flows (create user → recipe → search → follow → rate → comment)
- **Smoke Tests**: Indexing and subscription functionality
- **Test Coverage**: Meaningful coverage for core features

## Section 4: Setup Checklist

```bash
# 1. Initialize NestJS project with GraphQL
npm i -g @nestjs/cli
nest new cookbook-connect-backend
cd cookbook-connect-backend
npm install @nestjs/graphql @nestjs/apollo graphql apollo-server-express

# 2. Install core dependencies
npm install @nestjs/config @nestjs/jwt @nestjs/passport
npm install @prisma/client prisma
npm install @elastic/elasticsearch
npm install redis ioredis
npm install openai
npm install class-validator class-transformer
npm install bcryptjs jsonwebtoken

# 3. Install dev dependencies
npm install -D @types/bcryptjs @types/jsonwebtoken
npm install -D eslint prettier husky lint-staged
npm install -D jest @types/jest ts-jest supertest
npm install -D @types/node typescript ts-node

# 4. Initialize Prisma
npx prisma init

# 5. Create Docker Compose file
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: cookbook_connect
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  elasticsearch_data:
  redis_data:
EOF

# 6. Start Docker containers
docker-compose up -d

# 7. Configure environment variables
cat > .env << 'EOF'
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cookbook_connect"
JWT_SECRET="your-jwt-secret-key"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"
ELASTICSEARCH_URL="http://localhost:9200"
REDIS_URL="redis://localhost:6379"
OPENAI_API_KEY="your-openai-api-key"
NODE_ENV="development"
PORT=3000
EOF

# 8. Generate Prisma client and run first migration
npx prisma generate
npx prisma db push

# 9. Configure TypeScript strict mode
# Update tsconfig.json to include "strict": true

# 10. Set up ESLint and Prettier
npx eslint --init
echo "module.exports = { semi: true, singleQuote: true, trailingComma: 'all' };" > .prettierrc.js

# 11. Initialize Git and pre-commit hooks
git init
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"

# 12. Start development server
npm run start:dev
```

## Section 5: Stage-wise Acceptance Criteria

### Stage 1: Environment Setup ✅

- [ ] NestJS application with GraphQL (Apollo Server) running
- [ ] Docker containers (PostgreSQL, Elasticsearch, Redis) operational
- [ ] Prisma schema configured with basic models
- [ ] Health check endpoints responding
- [ ] TypeScript strict mode enabled
- [ ] Basic folder structure implemented

### Stage 2: Core CRUD Operations ✅

- [ ] User registration, login, profile updates via GraphQL
- [ ] Recipe CRUD operations (create, read, update, delete)
- [ ] Ingredient management within recipes
- [ ] Rating system (1-5 stars) with validation
- [ ] Comment system with proper relationships
- [ ] User following/follower functionality
- [ ] Complex queries: recipes with avg ratings, comment counts
- [ ] User feed showing recipes from followed users
- [ ] Proper error handling and validation
- [ ] Database relationships correctly implemented

### Stage 3: Search & Discovery ✅

- [ ] All recipes indexed in Elasticsearch
- [ ] Ingredient-based search functionality
- [ ] Filtering by cuisine, difficulty, cooking time
- [ ] Auto-complete for ingredient suggestions
- [ ] Full-text search across titles and descriptions
- [ ] "Cook with what I have" ingredient matching
- [ ] Search result ranking by relevance and ratings
- [ ] Search responses under 100ms
- [ ] Search analytics tracking

### Stage 4: Real-time Updates ✅

- [ ] Real-time notifications for ratings and comments
- [ ] Live updates for new recipes from followed users
- [ ] GraphQL Subscriptions with JWT authentication
- [ ] Redis Pub/Sub integration
- [ ] Activity feeds with live data
- [ ] Proper error handling for connection issues
- [ ] Debounced/throttled events to prevent flooding
- [ ] Scalable real-time architecture

### Stage 5: AI Enhancement ✅

- [ ] OpenAI integration for recipe suggestions
- [ ] Recipe improvement suggestions
- [ ] Ingredient substitution recommendations
- [ ] Cooking tips based on recipe complexity
- [ ] AI response caching with TTL
- [ ] Rate limiting for AI API calls
- [ ] Error handling for AI service failures
- [ ] Response times under 5 seconds
- [ ] Cost-effective usage monitoring

## Section 6: Cursor System Behavior

When implementing features, I will follow this systematic approach:

### Feature Implementation Process

1. **Design Summary**: Provide 2-3 sentence overview of what the feature does and how it fits into the system
2. **File-level TODOs**: Create specific, actionable tasks using the todo_write tool
3. **Prisma Schema Updates**: Update schema.prisma with new models/fields and generate migration
4. **Module Structure**: Create/update module following the established folder structure
5. **Implementation Order**: Repository → Service → Resolver → DTOs → Tests
6. **GraphQL Schema**: Update schema.gql with new types, queries, mutations, subscriptions
7. **Integration**: Ensure proper integration with existing modules (auth, caching, search indexing)
8. **Testing**: Write unit tests for services and integration tests for resolvers
9. **Documentation**: Update relevant documentation and provide example queries

### Code Quality Standards

- Always use TypeScript strict mode with proper typing
- Follow the layered architecture (resolver → service → repository)
- Implement proper error handling with GraphQL-friendly error messages
- Use class-validator for input validation
- Apply security best practices (JWT auth, input sanitization)
- Optimize for performance (proper indexing, caching, N+1 prevention)
- Write meaningful tests with good coverage

### Commit and PR Guidelines

- **Commit Format**: `<type>(<scope>): <description>`
  - Types: feat, fix, chore, docs, test, refactor
  - Example: `feat(recipes): add ingredient-based search functionality`
- **PR Description**: Include summary, acceptance criteria, testing instructions, breaking changes
- **Branch Naming**: `feat/<feature-name>`, `fix/<bug-name>`, `chore/<task-name>`

### Response Pattern

For each feature request, I will:

1. Analyze requirements against existing codebase
2. Create comprehensive todo list for tracking
3. Implement changes following the established patterns
4. Provide example GraphQL queries/mutations
5. Suggest testing approach
6. Generate appropriate commit message and PR description

This systematic approach ensures consistency, maintainability, and adherence to the project's architectural principles while delivering working, tested features efficiently.
