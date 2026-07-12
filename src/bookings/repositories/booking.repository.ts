import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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

  async hasDuplicateBooking(
    serviceId: string,
    bookingDate: string,
    bookingTime: string,
  ): Promise<boolean> {
    const activeStatuses = [
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
      BookingStatus.COMPLETED,
    ];
    return this.repository.exists({
      where: {
        serviceId,
        bookingDate,
        bookingTime,
        status: In(activeStatuses),
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

    if (dto.bookingDate) {
      qb.andWhere('booking.bookingDate = :bookingDate', {
        bookingDate: dto.bookingDate,
      });
    }

    if (dto.search) {
      const searchPattern = `%${dto.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(booking.customerName) LIKE :searchPattern OR LOWER(booking.customerEmail) LIKE :searchPattern OR LOWER(booking.customerPhone) LIKE :searchPattern)',
        { searchPattern },
      );
    }

    // Whitelist allowed sorting columns to block dynamic injection
    const allowedSortFields = [
      'createdAt',
      'bookingDate',
      'bookingTime',
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
