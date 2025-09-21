import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AIServiceFactory } from './ai-service.factory';
import {
    AIChatMessage,
    AICompletionOptions,
    AIUsageMetrics,
    IAIService
} from './interfaces/ai-service.interface';

/**
 * Abstract AI Service that delegates to the configured provider
 * This is the main service that should be injected throughout the application
 */
@Injectable()
export class AIService implements IAIService, OnModuleInit {
    private readonly logger = new Logger(AIService.name);
    private aiProvider: IAIService;

    constructor(private aiServiceFactory: AIServiceFactory) { }

    async onModuleInit() {
        this.aiProvider = this.aiServiceFactory.createAIService();
        this.logger.log(`AI Service initialized with provider: ${this.aiProvider.getProviderName()}`);
    }

    /**
     * Generate a completion from a prompt
     */
    async generateCompletion(
        prompt: string,
        systemMessage?: string,
        options?: AICompletionOptions,
    ): Promise<string | null> {
        try {
            return await this.aiProvider.generateCompletion(prompt, systemMessage, options);
        } catch (error) {
            this.logger.error(`AI completion failed with ${this.aiProvider.getProviderName()}:`, error);
            return null;
        }
    }

    /**
     * Generate a chat completion from messages
     */
    async generateChatCompletion(
        messages: AIChatMessage[],
        options?: AICompletionOptions,
    ): Promise<string | null> {
        try {
            return await this.aiProvider.generateChatCompletion(messages, options);
        } catch (error) {
            this.logger.error(`AI chat completion failed with ${this.aiProvider.getProviderName()}:`, error);
            return null;
        }
    }

    /**
     * Get usage metrics for monitoring
     */
    async getUsageMetrics(): Promise<AIUsageMetrics> {
        try {
            return await this.aiProvider.getUsageMetrics();
        } catch (error) {
            this.logger.error(`Failed to get usage metrics from ${this.aiProvider.getProviderName()}:`, error);
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

    /**
     * Check if the AI service is healthy
     */
    async isHealthy(): Promise<boolean> {
        try {
            return await this.aiProvider.isHealthy();
        } catch (error) {
            this.logger.error(`Health check failed for ${this.aiProvider.getProviderName()}:`, error);
            return false;
        }
    }

    /**
     * Get the current provider name
     */
    getProviderName(): string {
        return this.aiProvider?.getProviderName() || 'Unknown';
    }

    /**
     * Get available providers
     */
    getAvailableProviders(): string[] {
        return this.aiServiceFactory.getAvailableProviders();
    }

    /**
     * Switch to a different provider (useful for testing or fallback)
     */
    switchProvider(): void {
        this.aiProvider = this.aiServiceFactory.createAIService();
        this.logger.log(`Switched to AI provider: ${this.aiProvider.getProviderName()}`);
    }
}
