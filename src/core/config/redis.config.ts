import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  cacheTtl: parseInt(process.env.CACHE_TTL || '300', 10),
  maxItems: parseInt(process.env.CACHE_MAX_ITEMS || '1000', 10),
}));
