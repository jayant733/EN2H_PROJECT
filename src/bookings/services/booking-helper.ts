import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Service } from '../../services/entities/service.entity';
import { Booking } from '../entities/booking.entity';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { BookingStatus } from '../../shared/enums/booking-status.enum';
import { UserRole } from '../../shared/enums/role.enum';

const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
};

export function validateBookingCreation(service: Service | null, dto: CreateBookingDto): void {
  if (!service || service.deletedAt) {
    throw new NotFoundException('The requested service catalog listing was not found.');
  }
  if (!service.isActive) {
    throw new BadRequestException('Cannot book a service that is currently inactive.');
  }
  const bookingDateTime = new Date(`${dto.bookingDate}T${dto.bookingTime}:00`);
  if (isNaN(bookingDateTime.getTime())) {
    throw new BadRequestException('Invalid bookingDate or bookingTime format');
  }
  if (bookingDateTime.getTime() <= Date.now()) {
    throw new BadRequestException('Booking scheduled time must be in the future.');
  }
}

export function validateStatusTransition(
  booking: Booking | null,
  newStatus: BookingStatus,
  userId: string,
  role: UserRole,
): void {
  if (!booking) {
    throw new NotFoundException('Requested booking reservation not found.');
  }

  if (booking.status === BookingStatus.CANCELLED && newStatus === BookingStatus.COMPLETED) {
    throw new BadRequestException('Cancelled bookings cannot be marked as completed.');
  }

  const isClientOwner = booking.clientId && booking.clientId === userId;
  const isVendorOwner = booking.service?.vendorId === userId;
  const isAdmin = role === UserRole.ADMIN;

  if (!isClientOwner && !isVendorOwner && !isAdmin) {
    throw new ForbiddenException('You do not have permission to modify this booking.');
  }

  if (isClientOwner && !isAdmin && !isVendorOwner && newStatus !== BookingStatus.CANCELLED) {
    throw new ForbiddenException('Clients are only permitted to cancel their booking reservations.');
  }

  if (isVendorOwner && !isAdmin && !isClientOwner && newStatus === BookingStatus.PENDING) {
    throw new ForbiddenException('Vendors are not permitted to transition bookings back to pending.');
  }

  const transitions = ALLOWED_TRANSITIONS[booking.status];
  if (!transitions || !transitions.includes(newStatus)) {
    throw new ConflictException(`Cannot transition booking status from ${booking.status} to ${newStatus}.`);
  }
}

export function validateBookingView(booking: Booking | null, userId: string, role: UserRole): void {
  if (!booking) {
    throw new NotFoundException('Requested booking reservation not found.');
  }
  const isClientOwner = booking.clientId && booking.clientId === userId;
  const isVendorOwner = booking.service?.vendorId === userId;
  const isAdmin = role === UserRole.ADMIN;

  if (!isClientOwner && !isVendorOwner && !isAdmin) {
    throw new ForbiddenException('You do not have permission to view this booking reservation.');
  }
}
