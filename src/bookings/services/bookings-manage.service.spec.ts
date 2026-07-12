import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { BookingRepository } from '../repositories/booking.repository';
import { BookingAuditLogRepository } from '../repositories/booking-audit-log.repository';
import { ServiceRepository } from '../../services/repositories/service.repository';
import { DataSource } from 'typeorm';
import { BookingStatus } from '../../shared/enums/booking-status.enum';
import { UserRole } from '../../shared/enums/role.enum';
import { Booking } from '../entities/booking.entity';
import { Service } from '../../services/entities/service.entity';
import { QueryBookingDto } from '../dto/query-booking.dto';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

describe('BookingsService - Manage', () => {
  let service: BookingsService;
  let bookingRepository: jest.Mocked<Pick<BookingRepository, 'findOneById' | 'save' | 'hasDuplicateBooking' | 'findWithFilters'>>;

  const mockEntityManager = {
    save: jest.fn((_, data) => Promise.resolve({ ...data, id: 'saved_id' })),
    create: jest.fn((_, data) => ({ id: 'new_id', ...data })),
  };

  beforeEach(async () => {
    const mockBookingRepository = { findOneById: jest.fn(), save: jest.fn(), hasDuplicateBooking: jest.fn(), findWithFilters: jest.fn() };
    const mockAuditLogRepository = { save: jest.fn() };
    const mockServiceRepository = { findOneById: jest.fn() };
    const mockDataSource = { transaction: jest.fn((cb) => cb(mockEntityManager)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: BookingRepository, useValue: mockBookingRepository },
        { provide: BookingAuditLogRepository, useValue: mockAuditLogRepository },
        { provide: ServiceRepository, useValue: mockServiceRepository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    bookingRepository = module.get(BookingRepository);
  });

  describe('updateStatus', () => {
    it('should successfully update status if transition is valid', async () => {
      const existing = { id: 'booking_1', clientId: 'client_1', status: BookingStatus.PENDING, service: { vendorId: 'vendor_1' } as unknown as Service } as Booking;
      bookingRepository.findOneById.mockResolvedValue(existing);

      const result = await service.updateStatus('booking_1', BookingStatus.CONFIRMED, 'vendor_1', UserRole.VENDOR);
      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });

    it('should throw BadRequestException if transition is from cancelled to completed', async () => {
      const existing = { id: 'booking_1', clientId: 'client_1', status: BookingStatus.CANCELLED, service: { vendorId: 'vendor_1' } as unknown as Service } as Booking;
      bookingRepository.findOneById.mockResolvedValue(existing);

      await expect(service.updateStatus('booking_1', BookingStatus.COMPLETED, 'vendor_1', UserRole.VENDOR)).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if client tries to confirm booking', async () => {
      const existing = { id: 'booking_1', clientId: 'client_1', status: BookingStatus.PENDING, service: { vendorId: 'vendor_1' } as unknown as Service } as Booking;
      bookingRepository.findOneById.mockResolvedValue(existing);

      await expect(service.updateStatus('booking_1', BookingStatus.CONFIRMED, 'client_1', UserRole.CLIENT)).rejects.toThrow(ForbiddenException);
    });

    it('should return booking directly if state matches (idempotent)', async () => {
      const existing = { id: 'booking_1', clientId: 'client_1', status: BookingStatus.PENDING, service: { vendorId: 'vendor_1' } as unknown as Service } as Booking;
      bookingRepository.findOneById.mockResolvedValue(existing);

      const result = await service.updateStatus('booking_1', BookingStatus.PENDING, 'client_1', UserRole.CLIENT);
      expect(result).toEqual(existing);
    });

    it('should throw ForbiddenException if vendor tries to transition to pending', async () => {
      const existing = { id: 'booking_1', clientId: 'client_1', status: BookingStatus.CONFIRMED, service: { vendorId: 'vendor_1' } as unknown as Service } as Booking;
      bookingRepository.findOneById.mockResolvedValue(existing);

      await expect(service.updateStatus('booking_1', BookingStatus.PENDING, 'vendor_1', UserRole.VENDOR)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findOne', () => {
    it('should successfully return booking details to client owner', async () => {
      const existing = { id: 'booking_1', clientId: 'client_1', service: { vendorId: 'vendor_1' } as unknown as Service } as Booking;
      bookingRepository.findOneById.mockResolvedValue(existing);
      const result = await service.findOne('booking_1', 'client_1', UserRole.CLIENT);
      expect(result).toEqual(existing);
    });

    it('should successfully return booking details to vendor owner', async () => {
      const existing = { id: 'booking_1', clientId: 'client_1', service: { vendorId: 'vendor_1' } as unknown as Service } as Booking;
      bookingRepository.findOneById.mockResolvedValue(existing);
      const result = await service.findOne('booking_1', 'vendor_1', UserRole.VENDOR);
      expect(result).toEqual(existing);
    });

    it('should throw ForbiddenException if user is not authorized to view the booking', async () => {
      const existing = { id: 'booking_1', clientId: 'client_1', service: { vendorId: 'vendor_1' } as unknown as Service } as Booking;
      bookingRepository.findOneById.mockResolvedValue(existing);
      await expect(service.findOne('booking_1', 'other_user', UserRole.CLIENT)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if booking does not exist', async () => {
      bookingRepository.findOneById.mockResolvedValue(null);
      await expect(service.findOne('missing', 'client_1', UserRole.CLIENT)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should filter query by clientId for client role', async () => {
      const query = new QueryBookingDto();
      bookingRepository.findWithFilters.mockResolvedValue([[{} as Booking], 1]);
      const result = await service.findAll(query, 'client_1', UserRole.CLIENT);
      expect(result.data).toHaveLength(1);
      expect(query.clientId).toBe('client_1');
    });

    it('should not filter query by clientId for admin role', async () => {
      const query = new QueryBookingDto();
      bookingRepository.findWithFilters.mockResolvedValue([[{} as Booking], 1]);
      await service.findAll(query, 'admin_1', UserRole.ADMIN);
      expect(query.clientId).toBeUndefined();
    });
  });
});
