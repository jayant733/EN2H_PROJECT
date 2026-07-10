import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    // Configure logger levels globally
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;
  const env = configService.get<string>('env') || 'development';
  const corsOrigin = configService.get<string>('cors.origin') || '*';

  // Enable graceful shutdown hooks for container signals (SIGTERM/SIGINT)
  app.enableShutdownHooks();

  // Helmet middleware for securing HTTP headers
  app.use(helmet());

  // Compression middleware to reduce network traffic size
  app.use(compression());

  // Configure CORS
  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Route Prefix
  app.setGlobalPrefix('api');

  // Enforce URI Versioning (pre-configured to version '1')
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global validation pipe with whitelist and transformation enabled
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global Exception Filter placeholder
  // app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger setup placeholder
  // const config = new DocumentBuilder()
  //   .setTitle('SaaS API')
  //   .build();
  // const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);

  logger.log(`==========================================================`);
  logger.log(`Application started in [${env}] mode`);
  logger.log(`Server is running at: http://localhost:${port}/api/v1`);
  logger.log(`==========================================================`);
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Application failed to start:', err);
  process.exit(1);
});
