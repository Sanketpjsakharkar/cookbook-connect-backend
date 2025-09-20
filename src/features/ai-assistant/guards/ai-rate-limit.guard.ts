import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { RedisService } from '@/core/infrastructure/redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AIRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(AIRateLimitGuard.name);
  private readonly maxRequestsPerHour: number;
  private readonly maxRequestsPerDay: number;
  private readonly maxTokensPerDay: number;

  constructor(
    private redisService: RedisService,
    private configService: ConfigService,
  ) {
    this.maxRequestsPerHour = this.configService.get<number>('ai.maxRequestsPerHour', 50);
    this.maxRequestsPerDay = this.configService.get<number>('ai.maxRequestsPerDay', 200);
    this.maxTokensPerDay = this.configService.get<number>('ai.maxTokensPerDay', 100000);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const ctx = GqlExecutionContext.create(context);
      const { req } = ctx.getContext();
      const user = req.user;

      if (!user) {
        this.logger.warn('AI rate limit check: No user found in request');
        return false;
      }

      const userId = user.id;
      const now = new Date();
      const hourKey = `ai:rate_limit:${userId}:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
      const dayKey = `ai:rate_limit:${userId}:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
      const tokensKey = `ai:tokens:${userId}:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

      // Check current usage
      const [hourlyRequests, dailyRequests, dailyTokens] = await Promise.all([
        this.getCount(hourKey),
        this.getCount(dayKey),
        this.getCount(tokensKey),
      ]);

      // Check rate limits
      if (hourlyRequests >= this.maxRequestsPerHour) {
        this.logger.warn(`AI rate limit exceeded: User ${userId} has made ${hourlyRequests} requests this hour`);
        return false;
      }

      if (dailyRequests >= this.maxRequestsPerDay) {
        this.logger.warn(`AI rate limit exceeded: User ${userId} has made ${dailyRequests} requests today`);
        return false;
      }

      if (dailyTokens >= this.maxTokensPerDay) {
        this.logger.warn(`AI token limit exceeded: User ${userId} has used ${dailyTokens} tokens today`);
        return false;
      }

      // Increment counters
      await Promise.all([
        this.incrementCounter(hourKey, 3600), // 1 hour TTL
        this.incrementCounter(dayKey, 86400), // 24 hours TTL
      ]);

      // Add rate limit headers to response (if available)
      const response = req.res;
      if (response) {
        response.setHeader('X-AI-RateLimit-Hourly-Remaining', this.maxRequestsPerHour - hourlyRequests - 1);
        response.setHeader('X-AI-RateLimit-Daily-Remaining', this.maxRequestsPerDay - dailyRequests - 1);
        response.setHeader('X-AI-Tokens-Daily-Remaining', this.maxTokensPerDay - dailyTokens);
      }

      return true;

    } catch (error) {
      this.logger.error('AI rate limit check failed:', error);
      // Allow request on error to avoid blocking legitimate requests
      return true;
    }
  }

  private async getCount(key: string): Promise<number> {
    try {
      const count = await this.redisService.get(key);
      return parseInt(count || '0', 10);
    } catch (error) {
      this.logger.error(`Failed to get count for key ${key}:`, error);
      return 0;
    }
  }

  private async incrementCounter(key: string, ttl: number): Promise<void> {
    try {
      const current = await this.getCount(key);
      await this.redisService.set(key, (current + 1).toString(), ttl);
    } catch (error) {
      this.logger.error(`Failed to increment counter for key ${key}:`, error);
    }
  }

  // Method to check user's current usage (for API responses)
  async getUserUsage(userId: string): Promise<{
    hourlyRequests: number;
    dailyRequests: number;
    dailyTokens: number;
    limits: {
      maxRequestsPerHour: number;
      maxRequestsPerDay: number;
      maxTokensPerDay: number;
    };
  }> {
    try {
      const now = new Date();
      const hourKey = `ai:rate_limit:${userId}:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
      const dayKey = `ai:rate_limit:${userId}:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
      const tokensKey = `ai:tokens:${userId}:${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

      const [hourlyRequests, dailyRequests, dailyTokens] = await Promise.all([
        this.getCount(hourKey),
        this.getCount(dayKey),
        this.getCount(tokensKey),
      ]);

      return {
        hourlyRequests,
        dailyRequests,
        dailyTokens,
        limits: {
          maxRequestsPerHour: this.maxRequestsPerHour,
          maxRequestsPerDay: this.maxRequestsPerDay,
          maxTokensPerDay: this.maxTokensPerDay,
        },
      };

    } catch (error) {
      this.logger.error(`Failed to get user usage for ${userId}:`, error);
      return {
        hourlyRequests: 0,
        dailyRequests: 0,
        dailyTokens: 0,
        limits: {
          maxRequestsPerHour: this.maxRequestsPerHour,
          maxRequestsPerDay: this.maxRequestsPerDay,
          maxTokensPerDay: this.maxTokensPerDay,
        },
      };
    }
  }
}
