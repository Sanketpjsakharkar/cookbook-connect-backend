import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ThrottlerModule } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { GraphQLFormattedError } from 'graphql';
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
import { AIModule } from '@/features/ai-assistant/ai.module';
import { AuthModule } from '@/features/auth/auth.module';
import { NotificationsModule } from '@/features/notifications/notifications.module';
import { RecipesModule } from '@/features/recipes/recipes.module';
import { SearchModule } from '@/features/search/search.module';
import { SocialModule } from '@/features/social/social.module';
import { UsersModule } from '@/features/users/users.module';
import { HealthModule } from '@/health/health.module';
import { JwtAuthGuard } from '@/shared/guards';

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
      subscriptions: {
        'graphql-ws': {
          onConnect: (context: any) => {
            const { connectionParams, extra } = context;
            // Extract JWT token from connection params
            if (connectionParams?.authorization) {
              extra.token = connectionParams.authorization.replace('Bearer ', '');
            }
          },
          onSubscribe: (context: any, message: any) => {
            const { extra } = context;
            // Add token to context for authentication
            return {
              ...message,
              extra,
            };
          },
        },
        'subscriptions-transport-ws': {
          onConnect: (connectionParams: any) => {
            // Extract JWT token from connection params for legacy transport
            if (connectionParams?.authorization) {
              return {
                token: connectionParams.authorization.replace('Bearer ', ''),
              };
            }
            return {};
          },
        },
      },
      context: ({ req, res, connection }: { req: Request; res: Response; connection?: any }) => {
        if (connection) {
          // WebSocket connection context
          return {
            req: {
              ...connection.context,
              headers: {
                authorization: connection.context.token ? `Bearer ${connection.context.token}` : '',
              },
            },
          };
        }
        // HTTP request context
        return { req, res };
      },
      formatError: (
        formattedError: GraphQLFormattedError,
      ): GraphQLFormattedError => {
        // Remove sensitive information from errors in production
        if (
          process.env.NODE_ENV === 'production' &&
          formattedError.extensions?.exception
        ) {
          const exception = formattedError.extensions.exception as any;
          delete exception.stacktrace;
        }
        return formattedError;
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
    AuthModule,
    UsersModule,
    RecipesModule,
    SocialModule,
    SearchModule,
    NotificationsModule,
    AIModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
