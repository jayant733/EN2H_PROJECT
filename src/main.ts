import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

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

  // Global validation pipe configuration
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips payload properties without decorators
      forbidNonWhitelisted: true, // Throws errors if extra fields are present
      transform: true, // Coerces plain parameters to DTO class instances
      transformOptions: {
        enableImplicitConversion: true, // Enables automatic parsing of primitives
      },
      stopAtFirstError: false, // Validates all fields completely before failing
      disableErrorMessages: env === 'production', // Shields internal DTO schemas in production
    }),
  );

  // Swagger OpenAPI Documentation Configuration only enabled in non-production environments
  if (env !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('SaaS Service Booking Platform API')
      .setDescription(
        'Production-grade booking scheduling engine contract schemas, authentication endpoints, and lifecycle transition hooks.',
      )
      .setVersion('1.0.0')
      .setContact(
        'API Development Team',
        'https://example.com/support',
        'api-support@example.com',
      )
      .setLicense('MIT License', 'https://opensource.org/licenses/MIT')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT Access Token',
          in: 'header',
        },
        'JWT-auth', // This credential name matches the Swagger security key
      )
      .addServer(`http://localhost:${port}/api/v1`, 'Local Development Server')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(port);

  logger.log(`==========================================================`);
  logger.log(`Application started in [${env}] mode`);
  logger.log(`Server is running at: http://localhost:${port}/api/v1`);
  logger.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
  logger.log(`==========================================================`);
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error('Application failed to start:', err);
  process.exit(1);
});
