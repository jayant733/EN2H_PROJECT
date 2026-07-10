import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus, Module, Global } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './../src/health/health.module';
import configuration from './../src/config/configuration';
import { environmentValidationSchema } from './../src/config/validation';
import { DataSource } from 'typeorm';

describe('HealthController (e2e)', () => {
  let app: INestApplication;
  let mockDataSource: {
    isInitialized: boolean;
    query: jest.Mock;
  };

  beforeEach(async () => {
    mockDataSource = {
      isInitialized: true,
      query: jest.fn(),
    };

    // Create a global mock module that emulates DatabaseModule exporting DataSource
    @Global()
    @Module({
      providers: [
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
      exports: [DataSource],
    })
    class MockDatabaseModule {}

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
          validationSchema: environmentValidationSchema,
        }),
        MockDatabaseModule,
        HealthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  it('/api/v1/health (GET) - DB healthy', () => {
    mockDataSource.query.mockResolvedValue([{ 1: 1 }]);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(HttpStatus.OK)
      .expect((res) => {
        const body = res.body as Record<string, unknown>;
        expect(body).toHaveProperty('status', 'up');
        expect(body).toHaveProperty('database');
        expect(body.database).toEqual({ status: 'up' });
        expect(body).toHaveProperty('environment');
        expect(body).toHaveProperty('version', '1.0.0');
        expect(body).toHaveProperty('uptime');
        expect(body).toHaveProperty('timestamp');
      });
  });

  it('/api/v1/health (GET) - DB unhealthy', () => {
    mockDataSource.query.mockRejectedValue(new Error('Connection failure'));

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(HttpStatus.SERVICE_UNAVAILABLE)
      .expect((res) => {
        const body = res.body as Record<string, unknown>;
        expect(body).toHaveProperty('status', 'down');
        expect(body).toHaveProperty('database');
        expect(body.database).toEqual({ status: 'down' });
        expect(body).toHaveProperty('environment');
        expect(body).toHaveProperty('version', '1.0.0');
        expect(body).toHaveProperty('uptime');
        expect(body).toHaveProperty('timestamp');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
