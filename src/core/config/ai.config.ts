import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
    // AI provider selection: 'gemini', 'openai', 'claude', etc.
    // If not specified, will auto-detect based on available API keys
    provider: process.env.AI_PROVIDER || 'gemini',

    // Cache settings for AI responses
    cacheTTL: parseInt(process.env.AI_CACHE_TTL || '3600', 10), // 1 hour

    // Rate limiting
    maxRequestsPerHour: parseInt(process.env.AI_MAX_REQUESTS_PER_HOUR || '100', 10),
    maxTokensPerRequest: parseInt(process.env.AI_MAX_TOKENS_PER_REQUEST || '1000', 10),

    // Fallback settings
    enableFallback: process.env.AI_ENABLE_FALLBACK === 'true',
    fallbackProvider: process.env.AI_FALLBACK_PROVIDER || 'gemini',
}));
