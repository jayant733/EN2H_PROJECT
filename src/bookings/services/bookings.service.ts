import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import { BookingRepository } from '../repositories/booking.repository';
import { BookingAuditLogRepository } from '../repositories/booking-audit-log.repository';
import { ServiceRepository } from '../../services/repositories/service.repository';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { CancelBookingDto } from '../dto/cancel-booking.dto';
import { QueryBookingDto } from '../dto/query-booking.dto';
import { Booking } from '../entities/booking.entity';
import { BookingStatus } from '../../shared/enums/booking-status.enum';
import { UserRole } from '../../shared/enums/role.enum';
import { BookingAuditLog } from '../entities/booking-audit-log.entity';
import {
  validateBookingCreation,
  validateStatusTransition,
  validateBookingView,
} from './booking-helper';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly auditLogRepository: BookingAuditLogRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateBookingDto, clientId: string | null): Promise<Booking> {
    const service = await this.serviceRepository.findOneById(dto.serviceId);
    validateBookingCreation(service, dto);

    const isDuplicate = await this.bookingRepository.hasDuplicateBooking(
      dto.serviceId,
      dto.bookingDate,
      dto.bookingTime,
    );
    if (isDuplicate) {
      throw new ConflictException(
        'A booking already exists for this service, date, and time.',
      );
    }

    try {
      return await this.dataSource.transaction(async (em) => {
        const booking = em.create(Booking, {
          clientId: clientId || null,
          serviceId: dto.serviceId,
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          customerPhone: dto.customerPhone,
          bookingDate: dto.bookingDate,
          bookingTime: dto.bookingTime,
          priceAtBooking: service!.price,
          status: BookingStatus.PENDING,
          notes: dto.notes,
          idempotencyKey: dto.idempotencyKey || null,
        });

        const savedBooking = await em.save(Booking, booking);

        const auditLog = em.create(BookingAuditLog, {
          bookingId: savedBooking.id,
          changedById: clientId || null,
          previousStatus: null,
          newStatus: BookingStatus.PENDING,
          reason: 'Initial booking creation',
        });
        await em.save(BookingAuditLog, auditLog);

        this.logger.log(
          `Booking created: ${savedBooking.id} for customer ${dto.customerName}`,
        );
        return savedBooking;
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.message.includes('idempotency')
      ) {
        throw new ConflictException(
          'A booking request with this idempotency key has already been processed.',
        );
      }
      this.logger.error('Failed to create booking transaction', error);
      throw error;
    }
  }

  async updateStatus(
    id: string,
    newStatus: BookingStatus,
    userId: string,
    role: UserRole,
    reason?: string,
  ): Promise<Booking> {
    const booking = await this.bookingRepository.findOneById(id);
    if (booking && booking.status === newStatus) {
      return booking;
    }
    validateStatusTransition(booking, newStatus, userId, role);

    return this.dataSource.transaction(async (em) => {
      const previousStatus = booking!.status;
      booking!.status = newStatus;

      const savedBooking = await em.save(Booking, booking!);

      const auditLog = em.create(BookingAuditLog, {
        bookingId: savedBooking.id,
        changedById: userId || null,
        previousStatus,
        newStatus,
        reason: reason || `Status updated to ${newStatus}`,
      });
      await em.save(BookingAuditLog, auditLog);

      this.logger.log(
        `Booking status transitioned: ${id} from ${previousStatus} to ${newStatus} by ${userId}`,
      );
      return savedBooking;
    });
  }

  async cancel(
    id: string,
    dto: CancelBookingDto,
    userId: string,
    role: UserRole,
  ): Promise<Booking> {
    return this.updateStatus(
      id,
      BookingStatus.CANCELLED,
      userId,
      role,
      dto.reason || 'Client cancellation request',
    );
  }

  async findOne(id: string, userId: string, role: UserRole): Promise<Booking> {
    const booking = await this.bookingRepository.findOneById(id);
    validateBookingView(booking, userId, role);
    return booking!;
  }

  async findAll(
    query: QueryBookingDto,
    userId: string,
    role: UserRole,
  ): Promise<{
    data: Booking[];
    total: number;
    page: number;
    limit: number;
  }> {
    if (role === UserRole.CLIENT) {
      query.clientId = userId;
    }
    const [data, total] = await this.bookingRepository.findWithFilters(query);
    return {
      data,
      total,
      page: query.page,
      limit: query.limit,
    };
  }
}
