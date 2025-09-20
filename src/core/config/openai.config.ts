import { registerAs } from '@nestjs/config';

export default registerAs('openai', () => ({
  apiKey: process.env.OPENAI_API_KEY,
  cacheTtl: parseInt(process.env.AI_CACHE_TTL || '3600', 10),
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '1000', 10),
  maxRequestsPerHour: parseInt(
    process.env.AI_MAX_REQUESTS_PER_HOUR || '100',
    10,
  ),
}));
