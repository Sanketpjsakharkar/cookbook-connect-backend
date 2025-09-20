export interface AIUsageMetrics {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    requestsToday: number;
    tokensToday: number;
    costToday: number;
}

export interface AICompletionOptions {
    maxTokens?: number;
    temperature?: number;
    cacheKey?: string;
    cacheTTL?: number;
}

export interface AIChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

/**
 * Abstract interface for AI service providers
 * Allows easy switching between OpenAI, Gemini, Claude, etc.
 */
export interface IAIService {
    /**
     * Generate a completion from a prompt
     */
    generateCompletion(
        prompt: string,
        systemMessage?: string,
        options?: AICompletionOptions,
    ): Promise<string | null>;

    /**
     * Generate a chat completion from messages
     */
    generateChatCompletion(
        messages: AIChatMessage[],
        options?: AICompletionOptions,
    ): Promise<string | null>;

    /**
     * Get usage metrics for monitoring
     */
    getUsageMetrics(): Promise<AIUsageMetrics>;

    /**
     * Check if the AI service is healthy
     */
    isHealthy(): Promise<boolean>;

    /**
     * Get the provider name (for logging/debugging)
     */
    getProviderName(): string;
}
