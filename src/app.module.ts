import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { CommonModule } from './common/common.module';
import { SharedModule } from './shared/shared.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ServicesModule } from './services/services.module';
import { BookingsModule } from './bookings/bookings.module';
import configuration from './config/configuration';
import { environmentValidationSchema } from './config/validation';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    // Global Config Module configuration with Joi validation schema
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: environmentValidationSchema,
      validationOptions: {
        allowUnknown: true, // Bypass validation check for standard OS parameters
        abortEarly: true, // Fail startup immediately if schema validation fails
      },
    }),

    // Persistent Layer Module
    DatabaseModule,

    // Shared Framework infrastructure
    CommonModule,
    SharedModule,
    HealthModule,

    // Domain Feature modules
    AuthModule,
    UsersModule,
    ServicesModule,
    BookingsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
