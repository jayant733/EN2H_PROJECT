import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seeds/seed.module';
import { SeedService } from './seeds/seed.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('SeedRunner');
  logger.log('Bootstrapping standalone Seed Application context...');

  const app = await NestFactory.createApplicationContext(SeedModule);
  const seedService = app.get(SeedService);

  try {
    await seedService.run();
  } catch (error) {
    logger.error('Seeding process failed with error:', error);
    await app.close();
    process.exit(1);
  }

  await app.close();
  logger.log('Seed context terminated safely.');
  process.exit(0);
}

bootstrap().catch((error) => {
  const logger = new Logger('SeedRunner');
  logger.error('Seed bootstrapping failed:', error);
  process.exit(1);
});
