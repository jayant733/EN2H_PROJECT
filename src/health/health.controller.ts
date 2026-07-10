import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check API service health status' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return this.healthService.getHealthCheck();
  }
}
