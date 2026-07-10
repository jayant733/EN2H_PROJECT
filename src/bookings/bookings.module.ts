import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { BookingAuditLog } from './entities/booking-audit-log.entity';
import { BookingRepository } from './repositories/booking.repository';
import { BookingAuditLogRepository } from './repositories/booking-audit-log.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, BookingAuditLog])],
  providers: [BookingRepository, BookingAuditLogRepository],
  exports: [BookingRepository, BookingAuditLogRepository],
})
export class BookingsModule {}
