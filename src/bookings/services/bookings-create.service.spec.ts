import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { BookingRepository } from '../repositories/booking.repository';
import { BookingAuditLogRepository } from '../repositories/booking-audit-log.repository';
import { ServiceRepository } from '../../services/repositories/service.repository';
import { DataSource, QueryFailedError } from 'typeorm';
import { BookingStatus } from '../../shared/enums/booking-status.enum';
import { UserRole } from '../../shared/enums/role.enum';
import { Booking } from '../entities/booking.entity';
import { Service } from '../../services/entities/service.entity';
import { CreateBookingDto } from '../dto/create-booking.dto';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('BookingsService - Create', () => {
  let service: BookingsService;
  let bookingRepository: jest.Mocked<Pick<BookingRepository, 'findOneById' | 'save' | 'hasDuplicateBooking' | 'findWithFilters'>>;
  let serviceRepository: jest.Mocked<Pick<ServiceRepository, 'findOneById'>>;
  let dataSource: jest.Mocked<DataSource>;

  const mockEntityManager = {
    create: jest.fn((_, data) => ({ id: 'new_id', ...data })),
    save: jest.fn((_, data) => Promise.resolve({ ...data, id: 'saved_id' })),
  };

  beforeEach(async () => {
    const mockBookingRepository = { findOneById: jest.fn(), save: jest.fn(), hasDuplicateBooking: jest.fn(), findWithFilters: jest.fn() };
    const mockAuditLogRepository = { save: jest.fn(), findByBookingId: jest.fn() };
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
    serviceRepository = module.get(ServiceRepository);
    dataSource = module.get<DataSource>(DataSource) as unknown as jest.Mocked<DataSource>;
  });

  describe('create', () => {
    it('should successfully create a pending booking inside a transaction', async () => {
      const dto: CreateBookingDto = {
        serviceId: 'service_1',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        customerPhone: '+1-555-0199',
        bookingDate: '2028-08-15',
        bookingTime: '10:00',
        notes: 'Hair styling',
        idempotencyKey: '8b7f525c-cc22-4467-93cf-8a291f97a5fb',
      };
      const mockService = { id: 'service_1', price: 50.0, duration: 30, isActive: true } as Service;
      serviceRepository.findOneById.mockResolvedValue(mockService);
      bookingRepository.hasDuplicateBooking.mockResolvedValue(false);

      const result = await service.create(dto, 'client_1');
      expect(result).toHaveProperty('id', 'saved_id');
      expect(result).toHaveProperty('status', BookingStatus.PENDING);
      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if service is missing', async () => {
      serviceRepository.findOneById.mockResolvedValue(null);
      const dto: CreateBookingDto = {
        serviceId: 'missing',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        customerPhone: '+1-555-0199',
        bookingDate: '2028-08-15',
        bookingTime: '10:00',
      };
      await expect(service.create(dto, 'client_1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if service is not active', async () => {
      const mockService = { id: 's1', isActive: false } as Service;
      serviceRepository.findOneById.mockResolvedValue(mockService);
      const dto: CreateBookingDto = {
        serviceId: 's1',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        customerPhone: '+1-555-0199',
        bookingDate: '2028-08-15',
        bookingTime: '10:00',
      };
      await expect(service.create(dto, 'client_1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if date is in the past', async () => {
      const mockService = { id: 's1', isActive: true } as Service;
      serviceRepository.findOneById.mockResolvedValue(mockService);
      const dto: CreateBookingDto = {
        serviceId: 's1',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        customerPhone: '+1-555-0199',
        bookingDate: '2020-01-01',
        bookingTime: '10:00',
      };
      await expect(service.create(dto, 'client_1')).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if there is a duplicate pending booking', async () => {
      const mockService = { id: 's1', isActive: true } as Service;
      serviceRepository.findOneById.mockResolvedValue(mockService);
      const dto: CreateBookingDto = {
        serviceId: 's1',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        customerPhone: '+1-555-0199',
        bookingDate: '2028-08-15',
        bookingTime: '10:00',
      };
      bookingRepository.hasDuplicateBooking.mockResolvedValue(true);
      await expect(service.create(dto, 'client_1')).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on duplicate idempotency key in create', async () => {
      const dto: CreateBookingDto = {
        serviceId: 'service_1',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
        customerPhone: '+1-555-0199',
        bookingDate: '2028-08-15',
        bookingTime: '10:00',
        idempotencyKey: '8b7f525c-cc22-4467-93cf-8a291f97a5fb',
      };
      const mockService = { id: 'service_1', price: 10, duration: 30, isActive: true } as Service;
      serviceRepository.findOneById.mockResolvedValue(mockService);
      bookingRepository.hasDuplicateBooking.mockResolvedValue(false);

      const dbError = new QueryFailedError('query', [], new Error('idempotency violation'));
      dataSource.transaction.mockRejectedValueOnce(dbError);

      await expect(service.create(dto, 'client_1')).rejects.toThrow(ConflictException);
    });
  });

  describe('cancel', () => {
    it('should call cancel on service layer and transition status to CANCELLED', async () => {
      const existing = {
        id: 'booking_1',
        clientId: 'client_1',
        status: BookingStatus.PENDING,
        service: { vendorId: 'vendor_1' } as unknown as Service,
      } as Booking;
      bookingRepository.findOneById.mockResolvedValue(existing);

      const result = await service.cancel('booking_1', { reason: 'No time' }, 'client_1', UserRole.CLIENT);
      expect(result.status).toBe(BookingStatus.CANCELLED);
    });
  });
});
