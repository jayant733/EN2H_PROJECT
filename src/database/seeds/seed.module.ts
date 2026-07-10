import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database.module';
import { UsersModule } from '../../users/users.module';
import { ServicesModule } from '../../services/services.module';
import { BookingsModule } from '../../bookings/bookings.module';
import { AuthModule } from '../../auth/auth.module';
import { SeedService } from './seed.service';
import configuration from '../../config/configuration';
import { environmentValidationSchema } from '../../config/validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: environmentValidationSchema,
    }),
    DatabaseModule,
    UsersModule,
    ServicesModule,
    BookingsModule,
    AuthModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}
