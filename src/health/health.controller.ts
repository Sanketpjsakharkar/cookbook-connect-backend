import { Controller, Get } from '@nestjs/common';
import { Public } from '@/shared/decorators';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  async check() {
    return this.healthService.checkHealth();
  }
}
