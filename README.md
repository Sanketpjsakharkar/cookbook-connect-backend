# CookBook Connect - Backend

A recipe sharing platform backend built with NestJS, GraphQL, PostgreSQL, Elasticsearch, and Redis.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose
- Git

### Setup

1. **Clone and install dependencies:**

   ```bash
   git clone <repository-url>
   cd cookbook-connect-backend
   pnpm install
   ```

2. **Environment configuration:**

   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

   **🆓 For AI features (Free!):**
   - Get your free Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Add `GEMINI_API_KEY="your-key-here"` to your `.env` file
   - See [AI Migration Guide](docs/ai-migration-guide.md) for details

3. **Start infrastructure services:**

   ```bash
   pnpm docker:up
   ```

4. **Set up database:**

   ```bash
   pnpm db:generate
   pnpm db:push
   ```

5. **Start development server:**
   ```bash
   pnpm start:dev
   ```

### 🔗 Access Points

- **GraphQL Playground**: http://localhost:3000/graphql
- **Health Check**: http://localhost:3000/health
- **Prisma Studio**: `pnpm db:studio`

## 📋 Available Scripts

### Development

- `pnpm start:dev` - Start development server with hot reload
- `pnpm start:debug` - Start with debugging enabled
- `pnpm build` - Build for production
- `pnpm start:prod` - Start production server

### Database

- `pnpm db:generate` - Generate Prisma client
- `pnpm db:push` - Push schema to database
- `pnpm db:migrate` - Create and run migrations
- `pnpm db:studio` - Open Prisma Studio

### Docker

- `pnpm docker:up` - Start all containers
- `pnpm docker:down` - Stop all containers
- `pnpm docker:logs` - View container logs

### Code Quality

- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm test` - Run unit tests
- `pnpm test:e2e` - Run end-to-end tests

## 🏗️ Architecture

### Folder Structure

```
src/
├── shared/          # Shared utilities, constants, enums
├── core/           # Core infrastructure (config, database)
├── features/       # Business domain modules
├── health/         # Health check endpoints
├── middleware/     # Custom middleware
└── graphql/        # GraphQL schema and plugins
```

### Tech Stack

- **Framework**: NestJS with TypeScript
- **API**: GraphQL with Apollo Server
- **Database**: PostgreSQL with Prisma ORM
- **Search**: Elasticsearch
- **Cache/PubSub**: Redis
- **AI**: Google Gemini API (Free tier available) 🆓
- **Testing**: Jest
- **Code Quality**: ESLint, Prettier, Husky

## 🧪 Testing

### Health Check

Test the GraphQL health query:

```graphql
query {
  health
}
```

Expected response: `"OK"`

### REST Health Check

```bash
curl http://localhost:3000/health
```

## 📊 Stage 1 Completion

✅ **Environment Setup Complete**

- [x] NestJS application with GraphQL (Apollo Server)
- [x] TypeScript with strict mode
- [x] Docker Compose (PostgreSQL, Elasticsearch, Redis)
- [x] Prisma ORM with schema
- [x] ESLint, Prettier, Husky hooks
- [x] Environment configuration
- [x] Health check endpoints (GraphQL + REST)

### Acceptance Criteria Met

- ✅ `docker-compose up` runs all containers
- ✅ `pnpm start:dev` boots NestJS without errors
- ✅ `http://localhost:3000/graphql` responds to health query

## 🔄 Next Steps

Ready for **Stage 2: Core CRUD Operations**

- User authentication and management
- Recipe CRUD operations
- Social features (ratings, comments, follows)
- Complex GraphQL queries and relationships

## 📝 Development Guidelines

See [PROJECT_DESIGN.md](./PROJECT_DESIGN.md) for detailed architecture and [.cursor/rules/cookbook-connect-rules.md](./.cursor/rules/cookbook-connect-rules.md) for development rules.

## 🐛 Troubleshooting

### Docker Issues

- Ensure Docker is running
- Try `pnpm docker:down && pnpm docker:up`

### Database Connection

- Check PostgreSQL container is healthy: `docker-compose ps`
- Verify DATABASE_URL in .env

### Build Errors

- Clear node_modules: `rm -rf node_modules && pnpm install`
- Regenerate Prisma client: `pnpm db:generate`
