import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { HealthService } from './health.service';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Check API service health and database connectivity status',
  })
  @ApiResponse({ status: 200, description: 'Service and database are healthy' })
  @ApiResponse({ status: 503, description: 'Service or database is unhealthy' })
  async getHealth(@Res() res: Response) {
    const health = await this.healthService.getHealthCheck();

    if (health.status === 'down') {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(health);
    }

    return res.status(HttpStatus.OK).json(health);
  }
}
