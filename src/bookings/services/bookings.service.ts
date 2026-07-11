import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import { BookingRepository } from '../repositories/booking.repository';
import { BookingAuditLogRepository } from '../repositories/booking-audit-log.repository';
import { ServiceRepository } from '../../services/repositories/service.repository';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { CancelBookingDto } from '../dto/cancel-booking.dto';
import { QueryBookingDto } from '../dto/query-booking.dto';
import { Booking } from '../entities/booking.entity';
import { BookingStatus } from '../../shared/enums/booking-status.enum';
import { ServiceStatus } from '../../shared/enums/service-status.enum';
import { UserRole } from '../../shared/enums/role.enum';
import { BookingAuditLog } from '../entities/booking-audit-log.entity';

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
};

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly bookingRepository: BookingRepository,
    private readonly auditLogRepository: BookingAuditLogRepository,
    private readonly serviceRepository: ServiceRepository,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateBookingDto, clientId: string): Promise<Booking> {
    const service = await this.serviceRepository.findOneById(dto.serviceId);

    if (!service || service.status === ServiceStatus.ARCHIVED) {
      throw new NotFoundException(
        'The requested service catalog listing was not found.',
      );
    }

    if (service.status !== ServiceStatus.ACTIVE) {
      throw new BadRequestException(
        'Cannot book a service that is currently inactive.',
      );
    }

    const scheduledDate = new Date(dto.scheduledAt);
    if (scheduledDate.getTime() <= Date.now()) {
      throw new BadRequestException(
        'Booking scheduled time must be in the future.',
      );
    }

    // App-level duplicate prevention check
    const isDuplicate = await this.bookingRepository.hasDuplicateBooking(
      clientId,
      dto.serviceId,
      scheduledDate,
    );
    if (isDuplicate) {
      throw new ConflictException(
        'You already have a pending booking reservation for this service at the exact same time.',
      );
    }

    const durationMs = service.durationMinutes * 60 * 1000;
    const endTime = new Date(scheduledDate.getTime() + durationMs);

    try {
      // Execute the entire booking persistence logic inside a transaction boundary
      return await this.dataSource.transaction(async (em) => {
        const booking = em.create(Booking, {
          clientId,
          serviceId: dto.serviceId,
          scheduledAt: scheduledDate,
          endTime,
          priceAtBooking: service.price,
          status: BookingStatus.PENDING,
          notes: dto.notes,
          idempotencyKey: dto.idempotencyKey,
        });

        const savedBooking = await em.save(Booking, booking);

        const auditLog = em.create(BookingAuditLog, {
          bookingId: savedBooking.id,
          changedById: clientId,
          previousStatus: null,
          newStatus: BookingStatus.PENDING,
          reason: 'Initial booking creation',
        });
        await em.save(BookingAuditLog, auditLog);

        this.logger.log(
          `Booking created: ${savedBooking.id} for client ${clientId}`,
        );
        return savedBooking;
      });
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.message.includes('exclude')
      ) {
        this.logger.warn(
          `Concurrency clash: Overlapping booking rejected for service ${dto.serviceId}`,
        );
        throw new ConflictException(
          'The requested appointment slot overlaps with another confirmed reservation.',
        );
      }
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

    if (!booking) {
      throw new NotFoundException('Requested booking reservation not found.');
    }

    // Role-based access control checking
    const isClientOwner = booking.clientId === userId;
    const isVendorOwner = booking.service?.vendorId === userId;
    const isAdmin = role === UserRole.ADMIN;

    if (!isClientOwner && !isVendorOwner && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to modify this booking.',
      );
    }

    // Idempotent short-circuit: if requested status matches current status, return success directly
    if (booking.status === newStatus) {
      return booking;
    }

    // Client restriction: clients can ONLY cancel bookings
    if (
      isClientOwner &&
      !isAdmin &&
      !isVendorOwner &&
      newStatus !== BookingStatus.CANCELLED
    ) {
      throw new ForbiddenException(
        'Clients are only permitted to cancel their booking reservations.',
      );
    }

    // Vendor restriction: vendors cannot perform client-only tasks (if any) or admin tasks
    if (
      isVendorOwner &&
      !isAdmin &&
      !isClientOwner &&
      newStatus === BookingStatus.PENDING
    ) {
      throw new ForbiddenException(
        'Vendors are not permitted to transition bookings back to pending.',
      );
    }

    const transitions = ALLOWED_TRANSITIONS[booking.status];
    if (!transitions || !transitions.includes(newStatus)) {
      this.logger.warn(
        `Transition conflict: Rejected invalid transition from ${booking.status} to ${newStatus} on booking ${id}`,
      );
      throw new ConflictException(
        `Cannot transition booking status from ${booking.status} to ${newStatus}.`,
      );
    }

    return this.dataSource.transaction(async (em) => {
      const previousStatus = booking.status;
      booking.status = newStatus;

      const savedBooking = await em.save(Booking, booking);

      const auditLog = em.create(BookingAuditLog, {
        bookingId: savedBooking.id,
        changedById: userId,
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

    if (!booking) {
      throw new NotFoundException('Requested booking reservation not found.');
    }

    const isClientOwner = booking.clientId === userId;
    const isVendorOwner = booking.service?.vendorId === userId;
    const isAdmin = role === UserRole.ADMIN;

    if (!isClientOwner && !isVendorOwner && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to view this booking reservation.',
      );
    }

    return booking;
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
    // If user is client, enforce filtering to only their own bookings
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
