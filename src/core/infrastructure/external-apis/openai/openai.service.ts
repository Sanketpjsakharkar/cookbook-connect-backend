import { RedisService } from '@/core/infrastructure/redis';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
    AIChatMessage,
    AICompletionOptions,
    AIUsageMetrics,
    IAIService
} from '../ai/interfaces/ai-service.interface';

@Injectable()
export class OpenAIService implements IAIService {
    private readonly logger = new Logger(OpenAIService.name);
    private readonly client: OpenAI;
    private readonly maxTokens: number;
    private readonly model: string;
    private readonly temperature: number;

    constructor(
        private configService: ConfigService,
        private redisService: RedisService,
    ) {
        const apiKey = this.configService.get<string>('openai.apiKey');
        if (!apiKey) {
            this.logger.warn('OpenAI API key not configured. AI features will be disabled.');
        }

        this.client = new OpenAI({
            apiKey: apiKey || 'dummy-key',
        });

        this.maxTokens = this.configService.get<number>('openai.maxTokens', 1000);
        this.model = this.configService.get<string>('openai.model', 'gpt-3.5-turbo');
        this.temperature = this.configService.get<number>('openai.temperature', 0.7);
    }

    async generateCompletion(
        prompt: string,
        systemMessage?: string,
        options?: AICompletionOptions,
    ): Promise<string | null> {
        try {
            // Check cache first if cache key provided
            if (options?.cacheKey) {
                const cached = await this.getCachedResponse(options.cacheKey);
                if (cached) {
                    this.logger.debug(`Cache hit for key: ${options.cacheKey}`);
                    return cached;
                }
            }

            // Check if API key is configured
            if (!this.configService.get<string>('openai.apiKey')) {
                this.logger.warn('OpenAI API key not configured');
                return null;
            }

            const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

            if (systemMessage) {
                messages.push({
                    role: 'system',
                    content: systemMessage,
                });
            }

            messages.push({
                role: 'user',
                content: prompt,
            });

            const startTime = Date.now();

            const completion = await this.client.chat.completions.create({
                model: this.model,
                messages,
                max_tokens: options?.maxTokens || this.maxTokens,
                temperature: options?.temperature || this.temperature,
            });

            const responseTime = Date.now() - startTime;
            const response = completion.choices[0]?.message?.content;

            if (!response) {
                this.logger.warn('Empty response from OpenAI');
                return null;
            }

            // Log usage metrics
            await this.logUsageMetrics(completion.usage, responseTime);

            // Cache response if cache key provided
            if (options?.cacheKey && response) {
                await this.cacheResponse(
                    options.cacheKey,
                    response,
                    options.cacheTTL || 3600, // Default 1 hour
                );
            }

            this.logger.debug(`OpenAI completion generated in ${responseTime}ms`);
            return response.trim();

        } catch (error) {
            this.logger.error('OpenAI API error:', error);

            // Log the error for monitoring
            await this.logError(error as Error);

            return null;
        }
    }

    async generateChatCompletion(
        messages: AIChatMessage[],
        options?: AICompletionOptions,
    ): Promise<string | null> {
        try {
            // Check cache first if cache key provided
            if (options?.cacheKey) {
                const cached = await this.getCachedResponse(options.cacheKey);
                if (cached) {
                    return cached;
                }
            }

            const startTime = Date.now();

            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                })),
                max_tokens: options?.maxTokens || this.maxTokens,
                temperature: options?.temperature || this.temperature,
            });

            const responseTime = Date.now() - startTime;
            const content = response.choices[0]?.message?.content;

            if (!content) {
                this.logger.warn('No content in OpenAI response');
                return null;
            }

            // Log usage metrics
            await this.logUsageMetrics(response.usage, responseTime);

            // Cache the response if cache key provided
            if (options?.cacheKey) {
                await this.cacheResponse(options.cacheKey, content, options.cacheTTL || 3600);
            }

            this.logger.debug(`OpenAI chat completion generated in ${responseTime}ms`);
            return content.trim();

        } catch (error) {
            this.logger.error('OpenAI chat completion error:', error);
            await this.logError(error as Error);
            return null;
        }
    }

    async isHealthy(): Promise<boolean> {
        try {
            if (!this.configService.get<string>('openai.apiKey')) {
                return false;
            }

            // Simple health check with minimal token usage
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 5,
            });

            return !!response.choices[0]?.message?.content;
        } catch (error) {
            this.logger.error('OpenAI health check failed:', error);
            return false;
        }
    }

    getProviderName(): string {
        return 'OpenAI';
    }

    async getUsageMetrics(): Promise<AIUsageMetrics> {
        try {
            const today = new Date().toISOString().split('T')[0];

            const [
                totalRequests,
                totalTokens,
                totalCost,
                requestsToday,
                tokensToday,
                costToday,
            ] = await Promise.all([
                this.redisService.get('ai:metrics:total_requests'),
                this.redisService.get('ai:metrics:total_tokens'),
                this.redisService.get('ai:metrics:total_cost'),
                this.redisService.get(`ai:metrics:requests:${today}`),
                this.redisService.get(`ai:metrics:tokens:${today}`),
                this.redisService.get(`ai:metrics:cost:${today}`),
            ]);

            return {
                totalRequests: parseInt(totalRequests || '0', 10),
                totalTokens: parseInt(totalTokens || '0', 10),
                totalCost: parseFloat(totalCost || '0'),
                requestsToday: parseInt(requestsToday || '0', 10),
                tokensToday: parseInt(tokensToday || '0', 10),
                costToday: parseFloat(costToday || '0'),
            };
        } catch (error) {
            this.logger.error('Failed to get usage metrics:', error);
            return {
                totalRequests: 0,
                totalTokens: 0,
                totalCost: 0,
                requestsToday: 0,
                tokensToday: 0,
                costToday: 0,
            };
        }
    }

    private async getCachedResponse(cacheKey: string): Promise<string | null> {
        try {
            return await this.redisService.get(`ai:cache:${cacheKey}`);
        } catch (error) {
            this.logger.error(`Failed to get cached response for ${cacheKey}:`, error);
            return null;
        }
    }

    private async cacheResponse(
        cacheKey: string,
        response: string,
        ttlSeconds: number,
    ): Promise<void> {
        try {
            await this.redisService.set(`ai:cache:${cacheKey}`, response, ttlSeconds);
        } catch (error) {
            this.logger.error(`Failed to cache response for ${cacheKey}:`, error);
        }
    }

    private async logUsageMetrics(
        usage: OpenAI.Completions.CompletionUsage | undefined,
        responseTime: number,
    ): Promise<void> {
        if (!usage) return;

        try {
            const today = new Date().toISOString().split('T')[0];
            const cost = this.calculateCost(usage.total_tokens);

            // Update total metrics
            await Promise.all([
                this.incrementMetric('ai:metrics:total_requests', 1),
                this.incrementMetric('ai:metrics:total_tokens', usage.total_tokens),
                this.incrementMetric('ai:metrics:total_cost', cost),
                this.incrementMetric(`ai:metrics:requests:${today}`, 1, 86400), // 24h TTL
                this.incrementMetric(`ai:metrics:tokens:${today}`, usage.total_tokens, 86400),
                this.incrementMetric(`ai:metrics:cost:${today}`, cost, 86400),
            ]);

            // Log performance metrics
            await this.redisService.set(
                `ai:metrics:last_response_time`,
                responseTime.toString(),
                3600,
            );

            this.logger.debug(
                `AI usage: ${usage.total_tokens} tokens, $${cost.toFixed(4)}, ${responseTime}ms`,
            );
        } catch (error) {
            this.logger.error('Failed to log usage metrics:', error);
        }
    }

    private async incrementMetric(
        key: string,
        value: number,
        ttl?: number,
    ): Promise<void> {
        try {
            const current = await this.redisService.get(key);
            const newValue = (parseFloat(current || '0') + value).toString();
            await this.redisService.set(key, newValue, ttl);
        } catch (error) {
            this.logger.error(`Failed to increment metric ${key}:`, error);
        }
    }

    private calculateCost(tokens: number): number {
        // GPT-3.5-turbo pricing (as of 2024): $0.002 per 1K tokens
        // GPT-4 pricing: $0.03 per 1K tokens for input, $0.06 for output
        const pricePerToken = this.model.includes('gpt-4') ? 0.00003 : 0.000002;
        return tokens * pricePerToken;
    }

    private async logError(error: Error): Promise<void> {
        try {
            const today = new Date().toISOString().split('T')[0];
            await this.incrementMetric(`ai:metrics:errors:${today}`, 1, 86400);

            // Store recent errors for debugging
            const errorLog = {
                timestamp: new Date().toISOString(),
                message: error.message,
                stack: error.stack,
            };

            await this.redisService.set(
                `ai:errors:${Date.now()}`,
                JSON.stringify(errorLog),
                3600, // Keep errors for 1 hour
            );
        } catch (logError) {
            this.logger.error('Failed to log error:', logError);
        }
    }
}
