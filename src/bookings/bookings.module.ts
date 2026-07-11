import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { BookingAuditLog } from './entities/booking-audit-log.entity';
import { BookingRepository } from './repositories/booking.repository';
import { BookingAuditLogRepository } from './repositories/booking-audit-log.repository';
import { BookingsController } from './controllers/bookings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, BookingAuditLog])],
  controllers: [BookingsController],
  providers: [BookingRepository, BookingAuditLogRepository],
  exports: [BookingRepository, BookingAuditLogRepository],
})
export class BookingsModule {}
