import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService) {}

  getHealthCheck() {
    return {
      status: 'up',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: this.configService.get<string>('env'),
      version: '1.0.0',
      database: {
        status: 'up', // Placeholder database status check
      },
    };
  }
}
