import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { BookingAuditLog } from './entities/booking-audit-log.entity';
import { BookingRepository } from './repositories/booking.repository';
import { BookingAuditLogRepository } from './repositories/booking-audit-log.repository';
import { BookingsController } from './controllers/bookings.controller';
import { BookingsService } from './services/bookings.service';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, BookingAuditLog]),
    ServicesModule,
  ],
  controllers: [BookingsController],
  providers: [BookingRepository, BookingAuditLogRepository, BookingsService],
  exports: [BookingRepository, BookingAuditLogRepository, BookingsService],
})
export class BookingsModule {}
