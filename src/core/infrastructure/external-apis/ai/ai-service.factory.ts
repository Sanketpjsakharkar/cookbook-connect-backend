import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from '../gemini/gemini.service';
import { OpenAIService } from '../openai/openai.service';
import { IAIService } from './interfaces/ai-service.interface';

export enum AIProvider {
    GEMINI = 'gemini',
    OPENAI = 'openai',
    // Future providers can be added here
    // CLAUDE = 'claude',
    // HUGGINGFACE = 'huggingface',
}

/**
 * Factory for creating AI service instances based on configuration
 * Supports multiple AI providers with easy switching
 */
@Injectable()
export class AIServiceFactory {
    private readonly logger = new Logger(AIServiceFactory.name);

    constructor(
        private configService: ConfigService,
        private geminiService: GeminiService,
        private openaiService: OpenAIService,
    ) { }

    /**
     * Create an AI service instance based on configuration
     */
    createAIService(): IAIService {
        const provider = this.getConfiguredProvider();

        switch (provider) {
            case AIProvider.GEMINI:
                this.logger.log('Using Gemini AI provider');
                return this.geminiService;

            case AIProvider.OPENAI:
                this.logger.log('Using OpenAI provider');
                return this.openaiService;

            default:
                this.logger.warn(`Unknown AI provider: ${provider}, falling back to Gemini`);
                return this.geminiService;
        }
    }

    /**
     * Get the configured AI provider from environment
     */
    private getConfiguredProvider(): AIProvider {
        const provider = this.configService.get<string>('ai.provider', 'gemini').toLowerCase();

        // Check if the provider is valid
        if (Object.values(AIProvider).includes(provider as AIProvider)) {
            return provider as AIProvider;
        }

        // Auto-detect based on available API keys
        const geminiKey = this.configService.get<string>('gemini.apiKey');
        const openaiKey = this.configService.get<string>('openai.apiKey');

        if (geminiKey) {
            this.logger.log('Auto-detected Gemini API key, using Gemini provider');
            return AIProvider.GEMINI;
        }

        if (openaiKey) {
            this.logger.log('Auto-detected OpenAI API key, using OpenAI provider');
            return AIProvider.OPENAI;
        }

        this.logger.warn('No AI API keys found, defaulting to Gemini');
        return AIProvider.GEMINI;
    }

    /**
     * Get all available providers
     */
    getAvailableProviders(): AIProvider[] {
        const providers: AIProvider[] = [];

        if (this.configService.get<string>('gemini.apiKey')) {
            providers.push(AIProvider.GEMINI);
        }

        if (this.configService.get<string>('openai.apiKey')) {
            providers.push(AIProvider.OPENAI);
        }

        return providers;
    }
}
