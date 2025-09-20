import { Injectable } from '@nestjs/common';
import { HealthCheckService } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './indicators/database.indicator';

@Injectable()
export class HealthService {
  constructor(
    private readonly health: HealthCheckService,
    private readonly databaseHealthIndicator: DatabaseHealthIndicator,
  ) {}

  async checkHealth() {
    return this.health.check([
      () => this.databaseHealthIndicator.isHealthy('database'),
    ]);
  }
}
