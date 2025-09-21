import { RedisService } from '@/core/infrastructure/redis';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    AIChatMessage,
    AICompletionOptions,
    AIUsageMetrics,
    IAIService
} from '../ai/interfaces/ai-service.interface';

@Injectable()
export class GeminiService implements IAIService {
    private readonly logger = new Logger(GeminiService.name);
    private readonly apiKey: string | undefined;
    private readonly model: string;
    private readonly baseUrl: string;
    private readonly temperature: number;

    constructor(
        private configService: ConfigService,
        private redisService: RedisService,
    ) {
        this.apiKey = this.configService.get<string>('gemini.apiKey');
        if (!this.apiKey) {
            this.logger.warn('Gemini API key not configured. AI features will be disabled.');
        }

        this.model = this.configService.get<string>('gemini.model', 'gemini-1.5-flash');
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.temperature = this.configService.get<number>('gemini.temperature', 0.7);
    }

    async generateCompletion(
        prompt: string,
        systemMessage?: string,
        options?: AICompletionOptions,
    ): Promise<string | null> {
        if (!this.apiKey) {
            this.logger.warn('Gemini API key not configured');
            return null;
        }

        const cacheKey = options?.cacheKey;
        const cacheTTL = options?.cacheTTL || 3600; // 1 hour default

        // Check cache first
        if (cacheKey) {
            try {
                const cached = await this.redisService.get(cacheKey);
                if (cached) {
                    this.logger.debug(`Cache hit for key: ${cacheKey}`);
                    return JSON.parse(cached);
                }
            } catch (error) {
                this.logger.warn('Cache read error:', error);
            }
        }

        try {
            const startTime = Date.now();

            // Prepare the request body for Gemini API
            const requestBody = {
                contents: [
                    {
                        parts: [
                            {
                                text: systemMessage
                                    ? `${systemMessage}\n\nUser: ${prompt}`
                                    : prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: options?.temperature || this.temperature,
                    maxOutputTokens: options?.maxTokens || 1000,
                    topP: 0.8,
                    topK: 10
                }
            };

            const response = await fetch(
                `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`Gemini API error: ${response.status} - ${errorText}`);
                return null;
            }

            const data = await response.json();
            const responseTime = Date.now() - startTime;

            // Extract the generated text
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!generatedText) {
                this.logger.error('No text generated from Gemini API');
                return null;
            }

            // Log usage metrics
            await this.logUsage(responseTime, data.usageMetadata?.totalTokenCount || 0);

            // Cache the result
            if (cacheKey) {
                try {
                    await this.redisService.setex(
                        cacheKey,
                        cacheTTL,
                        JSON.stringify(generatedText),
                    );
                    this.logger.debug(`Cached result for key: ${cacheKey}`);
                } catch (error) {
                    this.logger.warn('Cache write error:', error);
                }
            }

            this.logger.debug(`Gemini completion generated in ${responseTime}ms`);
            return generatedText;

        } catch (error) {
            this.logger.error('Gemini API request failed:', error);
            return null;
        }
    }

    async generateChatCompletion(
        messages: AIChatMessage[],
        options?: AICompletionOptions,
    ): Promise<string | null> {
        if (!this.apiKey) {
            this.logger.warn('Gemini API key not configured');
            return null;
        }

        const cacheKey = options?.cacheKey;
        const cacheTTL = options?.cacheTTL || 3600;

        // Check cache first
        if (cacheKey) {
            try {
                const cached = await this.redisService.get(cacheKey);
                if (cached) {
                    this.logger.debug(`Cache hit for key: ${cacheKey}`);
                    return JSON.parse(cached);
                }
            } catch (error) {
                this.logger.warn('Cache read error:', error);
            }
        }

        try {
            const startTime = Date.now();

            // Convert messages to Gemini format
            const contents = messages.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            const requestBody = {
                contents,
                generationConfig: {
                    temperature: options?.temperature || this.temperature,
                    maxOutputTokens: options?.maxTokens || 1000,
                    topP: 0.8,
                    topK: 10
                }
            };

            const response = await fetch(
                `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                this.logger.error(`Gemini API error: ${response.status} - ${errorText}`);
                return null;
            }

            const data = await response.json();
            const responseTime = Date.now() - startTime;

            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!generatedText) {
                this.logger.error('No text generated from Gemini API');
                return null;
            }

            await this.logUsage(responseTime, data.usageMetadata?.totalTokenCount || 0);

            if (cacheKey) {
                try {
                    await this.redisService.setex(
                        cacheKey,
                        cacheTTL,
                        JSON.stringify(generatedText),
                    );
                } catch (error) {
                    this.logger.warn('Cache write error:', error);
                }
            }

            return generatedText;

        } catch (error) {
            this.logger.error('Gemini chat completion failed:', error);
            return null;
        }
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
                this.redisService.get('gemini:total_requests'),
                this.redisService.get('gemini:total_tokens'),
                this.redisService.get('gemini:total_cost'),
                this.redisService.get(`gemini:requests:${today}`),
                this.redisService.get(`gemini:tokens:${today}`),
                this.redisService.get(`gemini:cost:${today}`),
            ]);

            return {
                totalRequests: parseInt(totalRequests || '0'),
                totalTokens: parseInt(totalTokens || '0'),
                totalCost: parseFloat(totalCost || '0'),
                requestsToday: parseInt(requestsToday || '0'),
                tokensToday: parseInt(tokensToday || '0'),
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

    private async logUsage(responseTime: number, tokens: number): Promise<void> {
        try {
            const today = new Date().toISOString().split('T')[0];
            const cost = 0; // Gemini is free within limits

            // Increment counters
            await Promise.all([
                this.redisService.incr('gemini:total_requests'),
                this.redisService.incrby('gemini:total_tokens', tokens),
                this.redisService.incrbyfloat('gemini:total_cost', cost),
                this.redisService.incr(`gemini:requests:${today}`),
                this.redisService.incrby(`gemini:tokens:${today}`, tokens),
                this.redisService.incrbyfloat(`gemini:cost:${today}`, cost),
            ]);

            // Set expiration for daily counters (2 days)
            await Promise.all([
                this.redisService.expire(`gemini:requests:${today}`, 172800),
                this.redisService.expire(`gemini:tokens:${today}`, 172800),
                this.redisService.expire(`gemini:cost:${today}`, 172800),
            ]);

            this.logger.debug(
                `Usage logged: ${tokens} tokens, ${responseTime}ms response time`,
            );
        } catch (error) {
            this.logger.warn('Failed to log usage metrics:', error);
        }
    }

    async isHealthy(): Promise<boolean> {
        if (!this.apiKey) {
            return false;
        }

        try {
            const response = await this.generateCompletion(
                'Hello',
                'Respond with just "OK"',
                { maxTokens: 10 }
            );
            return response !== null;
        } catch (error) {
            this.logger.error('Health check failed:', error);
            return false;
        }
    }

    getProviderName(): string {
        return 'Google Gemini';
    }
}
