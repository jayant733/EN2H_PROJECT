import { Test, TestingModule } from '@nestjs/testing';
import { ServicesController } from './services.controller';
import { ServicesService } from '../services/services.service';
import { ServiceRepository } from '../repositories/service.repository';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { QueryServiceDto } from '../dto/query-service.dto';
import { ServiceResponseDto } from '../dto/service-response.dto';
import { ServiceStatus } from '../../shared/enums/service-status.enum';
import { Service } from '../entities/service.entity';
import { User } from '../../users/entities/user.entity';

describe('ServicesController', () => {
  let controller: ServicesController;
  let service: jest.Mocked<
    Pick<
      ServicesService,
      'create' | 'update' | 'remove' | 'findOne' | 'findAll'
    >
  >;

  beforeEach(async () => {
    const mockServicesService = {
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
    };

    const mockServiceRepository = {
      findOneById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        { provide: ServicesService, useValue: mockServicesService },
        { provide: ServiceRepository, useValue: mockServiceRepository },
      ],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
    service = module.get(ServicesService);
  });

  describe('findAll', () => {
    it('should return serialized service listings with pagination metadata', async () => {
      const query = new QueryServiceDto();
      const mockResult = {
        data: [
          {
            id: 'service_1',
            vendorId: 'vendor_1',
            title: 'Styling',
            price: 50.0,
            status: ServiceStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Service,
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      service.findAll.mockResolvedValue(mockResult);

      const result = await controller.findAll(query);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toBeInstanceOf(ServiceResponseDto);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a serialized service', async () => {
      const mockService = {
        id: 'service_1',
        vendorId: 'vendor_1',
        title: 'Haircut',
        price: 30.0,
        status: ServiceStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Service;

      service.findOne.mockResolvedValue(mockService);

      const result = await controller.findOne('service_1');
      expect(result).toBeInstanceOf(ServiceResponseDto);
      expect(result.id).toBe('service_1');
    });
  });

  describe('create', () => {
    it('should pass dto and user context to service and return serialized output', async () => {
      const dto: CreateServiceDto = {
        title: 'Shave',
        description: 'Hot towel shave',
        price: 20.0,
        durationMinutes: 30,
        category: 'Grooming',
        status: ServiceStatus.DRAFT,
      };

      const user = { id: 'vendor_1' } as User;
      const mockService = {
        id: 'service_1',
        vendorId: 'vendor_1',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Service;

      service.create.mockResolvedValue(mockService);

      const result = await controller.create(dto, user);
      expect(result).toBeInstanceOf(ServiceResponseDto);
      expect(result.id).toBe('service_1');
      expect(service.create).toHaveBeenCalledWith(dto, 'vendor_1');
    });
  });

  describe('update', () => {
    it('should update service parameters and return serialized result', async () => {
      const dto: UpdateServiceDto = { title: 'Updated Shave' };
      const user = { id: 'vendor_1' } as User;
      const mockService = {
        id: 'service_1',
        vendorId: 'vendor_1',
        title: 'Updated Shave',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Service;

      service.update.mockResolvedValue(mockService);

      const result = await controller.update('service_1', dto, user);
      expect(result).toBeInstanceOf(ServiceResponseDto);
      expect(result.title).toBe('Updated Shave');
      expect(service.update).toHaveBeenCalledWith('service_1', dto, 'vendor_1');
    });
  });

  describe('remove', () => {
    it('should delete (archive) service', async () => {
      const user = { id: 'vendor_1' } as User;
      service.remove.mockResolvedValue(undefined);

      await controller.remove('service_1', user);
      expect(service.remove).toHaveBeenCalledWith('service_1', 'vendor_1');
    });
  });
});
