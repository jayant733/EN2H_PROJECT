import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { BookingStatus } from '../../shared/enums/booking-status.enum';
import { QueryBookingDto } from '../dto/query-booking.dto';

@Injectable()
export class BookingRepository {
  constructor(
    @InjectRepository(Booking)
    private readonly repository: Repository<Booking>,
  ) {}

  async findOneById(id: string): Promise<Booking | null> {
    return this.repository.findOne({
      where: { id },
      relations: {
        service: true,
        client: true,
      },
    });
  }

  async save(booking: Partial<Booking>): Promise<Booking> {
    return this.repository.save(booking);
  }

  async hasOverlappingBooking(
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

  async hasDuplicateBooking(
    clientId: string,
    serviceId: string,
    scheduledAt: Date,
  ): Promise<boolean> {
    return this.repository.exists({
      where: {
        clientId,
        serviceId,
        scheduledAt,
        status: BookingStatus.PENDING, // Check active status: either PENDING or CONFIRMED
      },
    });
  }

  async findWithFilters(dto: QueryBookingDto): Promise<[Booking[], number]> {
    const qb = this.repository.createQueryBuilder('booking');

    // Eagerly join relationships to prevent N+1 query overhead
    qb.leftJoinAndSelect('booking.service', 'service');
    qb.leftJoinAndSelect('booking.client', 'client');

    if (dto.status) {
      qb.andWhere('booking.status = :status', { status: dto.status });
    }

    if (dto.clientId) {
      qb.andWhere('booking.clientId = :clientId', { clientId: dto.clientId });
    }

    if (dto.serviceId) {
      qb.andWhere('booking.serviceId = :serviceId', {
        serviceId: dto.serviceId,
      });
    }

    if (dto.fromDate) {
      qb.andWhere('booking.scheduledAt >= :fromDate', {
        fromDate: dto.fromDate,
      });
    }

    if (dto.toDate) {
      qb.andWhere('booking.scheduledAt <= :toDate', { toDate: dto.toDate });
    }

    // Whitelist allowed sorting columns to block dynamic injection
    const allowedSortFields = [
      'createdAt',
      'scheduledAt',
      'priceAtBooking',
      'status',
    ];
    const resolvedSortField = allowedSortFields.includes(dto.sort)
      ? `booking.${dto.sort}`
      : 'booking.createdAt';

    qb.orderBy(resolvedSortField, dto.order);

    // Apply pagination constraints
    qb.take(dto.limit);
    qb.skip((dto.page - 1) * dto.limit);

    return qb.getManyAndCount();
  }
}
