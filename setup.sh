#!/bin/bash

# CookBook Connect Backend - Setup Script
# This script follows the setup checklist from PROJECT_DESIGN.md

set -e

echo "🚀 Setting up CookBook Connect Backend..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📦 Installing core dependencies..."

# Core NestJS and GraphQL dependencies
npm install @nestjs/graphql @nestjs/apollo graphql apollo-server-express
npm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt passport-local
npm install @nestjs/throttler @nestjs/terminus

# Database and ORM
npm install @prisma/client prisma

# Search and caching
npm install @elastic/elasticsearch
npm install redis ioredis

# AI integration
npm install openai

# Validation and transformation
npm install class-validator class-transformer

# Security
npm install bcryptjs jsonwebtoken helmet

# Utilities
npm install uuid

echo "🛠️ Installing development dependencies..."

# TypeScript and types
npm install -D @types/bcryptjs @types/jsonwebtoken @types/passport-jwt @types/passport-local
npm install -D @types/uuid

# Code quality
npm install -D eslint prettier husky lint-staged
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser

# Testing
npm install -D jest @types/jest ts-jest supertest @types/supertest

# Development tools
npm install -D @types/node typescript ts-node nodemon

echo "🐳 Creating Docker Compose configuration..."

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
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  elasticsearch_data:
  redis_data:
EOF

echo "⚙️ Creating environment configuration..."

cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cookbook_connect"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# External Services
ELASTICSEARCH_URL="http://localhost:9200"
REDIS_URL="redis://localhost:6379"
OPENAI_API_KEY="your-openai-api-key"

# Application
NODE_ENV="development"
PORT=3000

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# AI Configuration
AI_CACHE_TTL=3600
AI_MAX_TOKENS=1000
EOF

echo "🗄️ Initializing Prisma..."

# Initialize Prisma
npx prisma init --datasource-provider postgresql

echo "📝 Creating basic Prisma schema..."

cat > prisma/schema.prisma << 'EOF'
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String   @unique
  password  String
  firstName String?
  lastName  String?
  bio       String?
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  recipes   Recipe[]
  ratings   Rating[]
  comments  Comment[]
  followers Follow[] @relation("UserFollowers")
  following Follow[] @relation("UserFollowing")

  @@map("users")
}

model Recipe {
  id          String   @id @default(uuid())
  title       String
  description String?
  cuisine     String?
  difficulty  String?
  cookingTime Int? // in minutes
  servings    Int?
  imageUrl    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  authorId     String
  author       User          @relation(fields: [authorId], references: [id], onDelete: Cascade)
  ingredients  Ingredient[]
  instructions Instruction[]
  ratings      Rating[]
  comments     Comment[]

  // Indexes
  @@index([authorId])
  @@index([title])
  @@index([createdAt])
  @@index([cuisine])
  @@index([difficulty])
  @@map("recipes")
}

model Ingredient {
  id       String  @id @default(uuid())
  name     String
  quantity Float
  unit     String
  notes    String?

  // Relations
  recipeId String
  recipe   Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  // Indexes
  @@index([recipeId])
  @@index([name])
  @@map("ingredients")
}

model Instruction {
  id          String @id @default(uuid())
  stepNumber  Int
  description String

  // Relations
  recipeId String
  recipe   Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  // Indexes
  @@index([recipeId])
  @@map("instructions")
}

model Rating {
  id        String   @id @default(uuid())
  value     Int // 1-5 stars
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  userId   String
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipeId String
  recipe   Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  // Unique constraint - one rating per user per recipe
  @@unique([userId, recipeId])
  @@index([recipeId])
  @@map("ratings")
}

model Comment {
  id        String   @id @default(uuid())
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  userId   String
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipeId String
  recipe   Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)

  // Indexes
  @@index([recipeId])
  @@index([userId])
  @@index([createdAt])
  @@map("comments")
}

model Follow {
  id          String   @id @default(uuid())
  createdAt   DateTime @default(now())

  // Relations
  followerId  String
  follower    User @relation("UserFollowing", fields: [followerId], references: [id], onDelete: Cascade)
  followingId String
  following   User @relation("UserFollowers", fields: [followingId], references: [id], onDelete: Cascade)

  // Unique constraint - one follow relationship per pair
  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
  @@map("follows")
}
EOF

echo "📋 Updating TypeScript configuration..."

cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2020",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["src/*"],
      "@/common/*": ["src/common/*"],
      "@/config/*": ["src/config/*"],
      "@/modules/*": ["src/modules/*"]
    }
  }
}
EOF

echo "🎨 Setting up ESLint and Prettier..."

cat > .eslintrc.js << 'EOF'
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    '@typescript-eslint/recommended',
    'prettier',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
  },
};
EOF

cat > .prettierrc << 'EOF'
{
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
EOF

echo "🪝 Setting up Git hooks..."

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
    git init
fi

# Install husky
npx husky install

# Create pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"

cat > .lintstagedrc << 'EOF'
{
  "*.{ts,js}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}
EOF

echo "📜 Updating package.json scripts..."

# Update package.json scripts using Node.js
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = {
  ...pkg.scripts,
  'build': 'nest build',
  'format': 'prettier --write \"src/**/*.ts\" \"test/**/*.ts\"',
  'start': 'nest start',
  'start:dev': 'nest start --watch',
  'start:debug': 'nest start --debug --watch',
  'start:prod': 'node dist/main',
  'lint': 'eslint \"{src,apps,libs,test}/**/*.ts\" --fix',
  'test': 'jest',
  'test:watch': 'jest --watch',
  'test:cov': 'jest --coverage',
  'test:debug': 'node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand',
  'test:e2e': 'jest --config ./test/jest-e2e.json',
  'db:generate': 'prisma generate',
  'db:push': 'prisma db push',
  'db:migrate': 'prisma migrate dev',
  'db:studio': 'prisma studio',
  'db:seed': 'ts-node prisma/seed.ts',
  'docker:up': 'docker-compose up -d',
  'docker:down': 'docker-compose down',
  'docker:logs': 'docker-compose logs -f'
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

echo "🐳 Starting Docker containers..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "🗄️ Generating Prisma client and pushing schema..."
npx prisma generate
npx prisma db push

echo "🎯 Creating basic folder structure..."

# Create the required folder structure
mkdir -p src/{common/{decorators,filters,guards,interceptors,pipes,utils},config,modules/{auth,users,recipes,ingredients,instructions,ratings,comments,follows,search,subscriptions,ai,health},graphql/types,test/{unit,integration,e2e}}

# Create each module structure
for module in auth users recipes ingredients instructions ratings comments follows search subscriptions ai health; do
    mkdir -p src/modules/$module/{dto,entities}
done

echo "📄 Creating basic health check..."

cat > src/modules/health/health.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
EOF

cat > src/modules/health/health.controller.ts << 'EOF'
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { PrismaService } from '@/common/services/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', new PrismaService()),
    ]);
  }
}
EOF

echo "🔧 Creating basic Prisma service..."

mkdir -p src/common/services

cat > src/common/services/prisma.service.ts << 'EOF'
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}
EOF

echo "📋 Creating basic app module..."

cat > src/app.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';

import { PrismaService } from './common/services/prisma.service';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
      sortSchema: true,
      playground: true,
      introspection: true,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60') * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT || '100'),
      },
    ]),
    HealthModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
EOF

echo "🚀 Updating main.ts..."

cat > src/main.ts << 'EOF'
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const port = configService.get('PORT', 3000);

  // Security
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        imgSrc: [`'self'`, 'data:', 'apollo-server-landing-page.cdn.apollographql.com'],
        scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
        manifestSrc: [`'self'`, 'apollo-server-landing-page.cdn.apollographql.com'],
        frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
      },
    },
  }));

  // CORS
  app.enableCors({
    origin: process.env.NODE_ENV === 'production' ? false : true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📊 GraphQL Playground: http://localhost:${port}/graphql`);
}

bootstrap();
EOF

echo "✅ Setup completed successfully!"
echo ""
echo "🎉 Next steps:"
echo "1. Update the .env file with your actual API keys"
echo "2. Run 'npm run start:dev' to start the development server"
echo "3. Visit http://localhost:3000/graphql for GraphQL Playground"
echo "4. Visit http://localhost:3000/health for health check"
echo ""
echo "📚 Useful commands:"
echo "  npm run start:dev     - Start development server"
echo "  npm run docker:up     - Start Docker containers"
echo "  npm run docker:down   - Stop Docker containers"
echo "  npm run db:studio     - Open Prisma Studio"
echo "  npm run db:migrate    - Run database migrations"
echo ""
echo "🔍 Check the PROJECT_DESIGN.md file for detailed documentation"
