import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingAuditLog } from '../entities/booking-audit-log.entity';

@Injectable()
export class BookingAuditLogRepository {
  constructor(
    @InjectRepository(BookingAuditLog)
    private readonly repository: Repository<BookingAuditLog>,
  ) {}

  save(log: Partial<BookingAuditLog>): Promise<BookingAuditLog> {
    return this.repository.save(log);
  }

  findByBookingId(bookingId: string): Promise<BookingAuditLog[]> {
    return this.repository.find({
      where: { bookingId },
      order: { createdAt: 'DESC' },
    });
  }
}
