import { Query, Resolver } from '@nestjs/graphql';
import { HealthService } from './health.service';

@Resolver()
export class HealthResolver {
  constructor(private readonly healthService: HealthService) {}

  @Query(() => String, { description: 'Health check query' })
  async health(): Promise<string> {
    const result = await this.healthService.checkHealth();
    return result.status === 'ok' ? 'OK' : 'ERROR';
  }
}
