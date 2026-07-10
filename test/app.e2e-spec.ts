import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './../src/health/health.module';
import configuration from './../src/config/configuration';
import { environmentValidationSchema } from './../src/config/validation';

describe('HealthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
          validationSchema: environmentValidationSchema,
        }),
        HealthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  it('/api/v1/health (GET)', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect((res) => {
        const body = res.body as Record<string, unknown>;
        expect(body).toHaveProperty('status', 'up');
        expect(body).toHaveProperty('environment');
        expect(typeof body.environment).toBe('string');
        expect(body).toHaveProperty('version', '1.0.0');
        expect(body).toHaveProperty('uptime');
        expect(body).toHaveProperty('timestamp');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
