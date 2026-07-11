import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { BookingRepository } from '../repositories/booking.repository';
import { BookingAuditLogRepository } from '../repositories/booking-audit-log.repository';
import { ServiceRepository } from '../../services/repositories/service.repository';
import { DataSource } from 'typeorm';
import { BookingStatus } from '../../shared/enums/booking-status.enum';
import { ServiceStatus } from '../../shared/enums/service-status.enum';
import { UserRole } from '../../shared/enums/role.enum';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Booking } from '../entities/booking.entity';
import { Service } from '../../services/entities/service.entity';
import { CreateBookingDto } from '../dto/create-booking.dto';

describe('BookingsService', () => {
  let service: BookingsService;
  let bookingRepository: jest.Mocked<
    Pick<
      BookingRepository,
      | 'findOneById'
      | 'save'
      | 'hasOverlappingBooking'
      | 'hasDuplicateBooking'
      | 'findWithFilters'
    >
  >;
  let serviceRepository: jest.Mocked<Pick<ServiceRepository, 'findOneById'>>;
  let dataSource: jest.Mocked<DataSource>;

  const mockEntityManager = {
    create: jest.fn((_entityClass: unknown, data: Record<string, unknown>) => ({
      id: 'new_id',
      ...data,
    })),
    save: jest.fn((_entityClass: unknown, data: Record<string, unknown>) =>
      Promise.resolve({ ...data, id: 'saved_id' }),
    ),
  };

  beforeEach(async () => {
    const mockBookingRepository = {
      findOneById: jest.fn(),
      save: jest.fn(),
      hasOverlappingBooking: jest.fn(),
      hasDuplicateBooking: jest.fn(),
      findWithFilters: jest.fn(),
    };

    const mockAuditLogRepository = {
      save: jest.fn(),
      findByBookingId: jest.fn(),
    };

    const mockServiceRepository = {
      findOneById: jest.fn(),
    };

    const mockDataSource = {
      transaction: jest.fn((cb: (em: typeof mockEntityManager) => unknown) =>
        cb(mockEntityManager),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: BookingRepository, useValue: mockBookingRepository },
        {
          provide: BookingAuditLogRepository,
          useValue: mockAuditLogRepository,
        },
        { provide: ServiceRepository, useValue: mockServiceRepository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    bookingRepository = module.get(BookingRepository);
    serviceRepository = module.get(ServiceRepository);
    dataSource = module.get<DataSource>(
      DataSource,
    ) as unknown as jest.Mocked<DataSource>;
  });

  describe('create', () => {
    it('should successfully create a pending booking inside a transaction', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dto: CreateBookingDto = {
        serviceId: 'service_1',
        scheduledAt: tomorrow,
        notes: 'Hair styling',
        idempotencyKey: 'idempotency_1',
      };

      const mockService = {
        id: 'service_1',
        price: 50.0,
        durationMinutes: 30,
        status: ServiceStatus.ACTIVE,
      } as Service;

      serviceRepository.findOneById.mockResolvedValue(mockService);
      bookingRepository.hasDuplicateBooking.mockResolvedValue(false);
      bookingRepository.hasOverlappingBooking.mockResolvedValue(false);

      const result = await service.create(dto, 'client_1');
      expect(result).toHaveProperty('id', 'saved_id');
      expect(result).toHaveProperty('status', BookingStatus.PENDING);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(dataSource.transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if service is missing or archived', async () => {
      serviceRepository.findOneById.mockResolvedValue(null);
      const dto = {
        serviceId: 'missing',
        scheduledAt: new Date(),
      } as CreateBookingDto;

      await expect(service.create(dto, 'client_1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if service is not active', async () => {
      const mockService = { id: 's1', status: ServiceStatus.DRAFT } as Service;
      serviceRepository.findOneById.mockResolvedValue(mockService);
      const dto = {
        serviceId: 's1',
        scheduledAt: new Date(),
      } as CreateBookingDto;

      await expect(service.create(dto, 'client_1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if date is in the past', async () => {
      const mockService = { id: 's1', status: ServiceStatus.ACTIVE } as Service;
      serviceRepository.findOneById.mockResolvedValue(mockService);

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dto = {
        serviceId: 's1',
        scheduledAt: yesterday,
      } as CreateBookingDto;

      await expect(service.create(dto, 'client_1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if client already has a duplicate pending booking', async () => {
      const mockService = { id: 's1', status: ServiceStatus.ACTIVE } as Service;
      serviceRepository.findOneById.mockResolvedValue(mockService);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dto = {
        serviceId: 's1',
        scheduledAt: tomorrow,
      } as CreateBookingDto;

      bookingRepository.hasDuplicateBooking.mockResolvedValue(true);

      await expect(service.create(dto, 'client_1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should successfully update status if transition is valid', async () => {
      const existing = {
        id: 'booking_1',
        clientId: 'client_1',
        status: BookingStatus.PENDING,
        service: { vendorId: 'vendor_1' } as unknown as Service,
      } as Booking;

      bookingRepository.findOneById.mockResolvedValue(existing);

      const result = await service.updateStatus(
        'booking_1',
        BookingStatus.CONFIRMED,
        'vendor_1',
        UserRole.VENDOR,
      );
      expect(result.status).toBe(BookingStatus.CONFIRMED);
    });

    it('should throw ConflictException if transition is forbidden', async () => {
      const existing = {
        id: 'booking_1',
        clientId: 'client_1',
        status: BookingStatus.CANCELLED,
        service: { vendorId: 'vendor_1' } as unknown as Service,
      } as Booking;

      bookingRepository.findOneById.mockResolvedValue(existing);

      await expect(
        service.updateStatus(
          'booking_1',
          BookingStatus.COMPLETED,
          'vendor_1',
          UserRole.VENDOR,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException if client tries to confirm booking', async () => {
      const existing = {
        id: 'booking_1',
        clientId: 'client_1',
        status: BookingStatus.PENDING,
        service: { vendorId: 'vendor_1' } as unknown as Service,
      } as Booking;

      bookingRepository.findOneById.mockResolvedValue(existing);

      await expect(
        service.updateStatus(
          'booking_1',
          BookingStatus.CONFIRMED,
          'client_1',
          UserRole.CLIENT,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return booking directly if state matches (idempotent)', async () => {
      const existing = {
        id: 'booking_1',
        clientId: 'client_1',
        status: BookingStatus.PENDING,
        service: { vendorId: 'vendor_1' } as unknown as Service,
      } as Booking;

      bookingRepository.findOneById.mockResolvedValue(existing);

      const result = await service.updateStatus(
        'booking_1',
        BookingStatus.PENDING,
        'client_1',
        UserRole.CLIENT,
      );
      expect(result).toEqual(existing);
    });
  });
});
