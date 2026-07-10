import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async getHealthCheck() {
    let dbStatus = 'down';
    let timeoutId: NodeJS.Timeout | undefined;

    try {
      if (this.dataSource.isInitialized) {
        const queryPromise = this.dataSource.query('SELECT 1');
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Database query timeout'));
          }, 2000);
        });

        // Run query and timeout race
        await Promise.race([queryPromise, timeoutPromise]);
        dbStatus = 'up';
      }
    } catch (error) {
      this.logger.error('Database liveness check failed:', error);
      dbStatus = 'down';
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }

    const overallStatus = dbStatus === 'up' ? 'up' : 'down';

    return {
      status: overallStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: this.configService.get<string>('env'),
      version: '1.0.0',
      database: {
        status: dbStatus,
      },
    };
  }
}
