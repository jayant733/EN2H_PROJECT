import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from '../services/bookings.service';
import { BookingRepository } from '../repositories/booking.repository';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingStatusDto } from '../dto/update-booking-status.dto';
import { CancelBookingDto } from '../dto/cancel-booking.dto';
import { QueryBookingDto } from '../dto/query-booking.dto';
import { BookingResponseDto } from '../dto/booking-response.dto';
import { BookingStatus } from '../../shared/enums/booking-status.enum';
import { Booking } from '../entities/booking.entity';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../shared/enums/role.enum';

describe('BookingsController', () => {
  let controller: BookingsController;
  let service: jest.Mocked<
    Pick<
      BookingsService,
      'create' | 'updateStatus' | 'cancel' | 'findOne' | 'findAll'
    >
  >;

  beforeEach(async () => {
    const mockBookingsService = {
      create: jest.fn(),
      updateStatus: jest.fn(),
      cancel: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
    };

    const mockBookingRepository = {
      findOneById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        { provide: BookingsService, useValue: mockBookingsService },
        { provide: BookingRepository, useValue: mockBookingRepository },
      ],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
    service = module.get(BookingsService);
  });

  describe('create', () => {
    it('should call service create and return a serialized booking', async () => {
      const dto: CreateBookingDto = {
        serviceId: 'service_1',
        scheduledAt: new Date(),
        notes: 'Grooming service',
        idempotencyKey: 'idempotency_1',
      };

      const user = { id: 'client_1' } as User;
      const mockResult = {
        id: 'booking_1',
        clientId: 'client_1',
        serviceId: 'service_1',
        priceAtBooking: 50.0,
        status: BookingStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Booking;

      service.create.mockResolvedValue(mockResult);

      const result = await controller.create(dto, user);
      expect(result).toBeInstanceOf(BookingResponseDto);
      expect(result.id).toBe('booking_1');
      expect(service.create).toHaveBeenCalledWith(dto, 'client_1');
    });
  });

  describe('findAll', () => {
    it('should return a list of paginated bookings', async () => {
      const query = new QueryBookingDto();
      const user = { id: 'client_1', role: UserRole.CLIENT } as User;
      const mockResult = {
        data: [
          {
            id: 'booking_1',
            clientId: 'client_1',
            status: BookingStatus.CONFIRMED,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Booking,
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query, user);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toBeInstanceOf(BookingResponseDto);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return details of a single booking', async () => {
      const user = { id: 'client_1', role: UserRole.CLIENT } as User;
      const mockBooking = {
        id: 'booking_1',
        clientId: 'client_1',
        status: BookingStatus.CONFIRMED,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Booking;

      service.findOne.mockResolvedValue(mockBooking);

      const result = await controller.findOne('booking_1', user);
      expect(result).toBeInstanceOf(BookingResponseDto);
      expect(result.id).toBe('booking_1');
    });
  });

  describe('updateStatus', () => {
    it('should update status and return updated serialization', async () => {
      const dto: UpdateBookingStatusDto = {
        status: BookingStatus.CONFIRMED,
        reason: 'Service confirmed by vendor',
      };
      const user = { id: 'vendor_1', role: UserRole.VENDOR } as User;
      const mockBooking = {
        id: 'booking_1',
        status: BookingStatus.CONFIRMED,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Booking;

      service.updateStatus.mockResolvedValue(mockBooking);

      const result = await controller.updateStatus('booking_1', dto, user);
      expect(result).toBeInstanceOf(BookingResponseDto);
      expect(result.status).toBe(BookingStatus.CONFIRMED);
      expect(service.updateStatus).toHaveBeenCalledWith(
        'booking_1',
        BookingStatus.CONFIRMED,
        'vendor_1',
        UserRole.VENDOR,
        'Service confirmed by vendor',
      );
    });
  });

  describe('cancel', () => {
    it('should call cancel on the service layer', async () => {
      const dto: CancelBookingDto = { reason: 'Client cancellation' };
      const user = { id: 'client_1', role: UserRole.CLIENT } as User;
      const mockBooking = {
        id: 'booking_1',
        status: BookingStatus.CANCELLED,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Booking;

      service.cancel.mockResolvedValue(mockBooking);

      const result = await controller.cancel('booking_1', dto, user);
      expect(result).toBeInstanceOf(BookingResponseDto);
      expect(result.status).toBe(BookingStatus.CANCELLED);
      expect(service.cancel).toHaveBeenCalledWith(
        'booking_1',
        dto,
        'client_1',
        UserRole.CLIENT,
      );
    });
  });
});
