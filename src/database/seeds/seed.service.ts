import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  run(): Promise<void> {
    this.logger.log('Starting database seeding...');

    // Future seeder execution steps:
    // await this.seedUsers();
    // await this.seedServices();
    // await this.seedBookings();

    this.logger.log('Database seeding completed successfully!');
    return Promise.resolve();
  }
}
