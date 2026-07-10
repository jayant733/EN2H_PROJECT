import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { BookingStatus } from '../../shared/enums/booking-status.enum';

@Injectable()
export class BookingRepository {
  constructor(
    @InjectRepository(Booking)
    private readonly repository: Repository<Booking>,
  ) {}

  findOneById(id: string): Promise<Booking | null> {
    return this.repository.findOne({
      where: { id },
      relations: {
        service: true,
        client: true,
      },
    });
  }

  save(booking: Partial<Booking>): Promise<Booking> {
    return this.repository.save(booking);
  }

  // Application-level backup overlap check (in case database exclusions are bypassed)
  hasOverlappingBooking(
    serviceId: string,
    start: Date,
    end: Date,
  ): Promise<boolean> {
    return this.repository.exists({
      where: {
        serviceId,
        status: BookingStatus.CONFIRMED,
        scheduledAt: LessThan(end),
        endTime: MoreThan(start),
      },
    });
  }
}
