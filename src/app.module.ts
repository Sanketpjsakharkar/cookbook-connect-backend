import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ThrottlerModule } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { join } from 'path';

// Core modules
import {
  appConfig,
  databaseConfig,
  elasticsearchConfig,
  jwtConfig,
  openaiConfig,
  redisConfig,
} from '@/core/config';
import { DatabaseModule } from '@/core/database';

// Feature modules
import { HealthModule } from '@/health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        elasticsearchConfig,
        redisConfig,
        openaiConfig,
      ],
      envFilePath: ['.env.local', '.env'],
    }),

    // GraphQL
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      introspection: true,
      context: ({ req, res }: { req: Request; res: Response }) => ({
        req,
        res,
      }),
      formatError: (
        error: Error & { extensions?: { exception?: { stacktrace?: string } } },
      ) => {
        // Remove sensitive information from errors in production
        if (process.env.NODE_ENV === 'production') {
          delete error.extensions?.exception?.stacktrace;
        }
        return error;
      },
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
      },
    ]),

    // Core modules
    DatabaseModule,

    // Feature modules
    HealthModule,
  ],
})
export class AppModule {}
