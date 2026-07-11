import { Test, TestingModule } from '@nestjs/testing';
import { ServicesService } from './services.service';
import { ServiceRepository } from '../repositories/service.repository';
import { Service } from '../entities/service.entity';
import { ServiceStatus } from '../../shared/enums/service-status.enum';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { QueryServiceDto } from '../dto/query-service.dto';

describe('ServicesService', () => {
  let service: ServicesService;
  let repository: jest.Mocked<
    Pick<ServiceRepository, 'findOneById' | 'findWithFilters' | 'save'>
  >;

  beforeEach(async () => {
    const mockRepository = {
      findOneById: jest.fn(),
      findWithFilters: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        { provide: ServiceRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    repository = module.get(ServiceRepository);
  });

  describe('create', () => {
    it('should successfully create a service catalog listing', async () => {
      const dto: CreateServiceDto = {
        title: 'Premium Massage',
        description: 'Includes hot stone therapy',
        price: 90.0,
        durationMinutes: 60,
        category: 'Wellness',
        status: ServiceStatus.DRAFT,
      };

      repository.save.mockResolvedValue({
        id: 'service_id',
        vendorId: 'vendor_id',
        ...dto,
      } as Service);

      const result = await service.create(dto, 'vendor_id');
      expect(result).toHaveProperty('id', 'service_id');
      expect(result).toHaveProperty('vendorId', 'vendor_id');
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should successfully update own service', async () => {
      const existing = {
        id: 'service_id',
        vendorId: 'vendor_id',
        title: 'Old Title',
        status: ServiceStatus.ACTIVE,
      } as Service;

      const dto: UpdateServiceDto = { title: 'New Title' };

      repository.findOneById.mockResolvedValue(existing);
      repository.save.mockResolvedValue({ ...existing, ...dto });

      const result = await service.update('service_id', dto, 'vendor_id');
      expect(result.title).toBe('New Title');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if service does not exist', async () => {
      repository.findOneById.mockResolvedValue(null);
      const dto: UpdateServiceDto = { title: 'New Title' };

      await expect(
        service.update('missing_id', dto, 'vendor_id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not the vendor owner', async () => {
      const existing = {
        id: 'service_id',
        vendorId: 'owner_id',
        status: ServiceStatus.ACTIVE,
      } as Service;
      const dto: UpdateServiceDto = { title: 'New Title' };

      repository.findOneById.mockResolvedValue(existing);

      await expect(
        service.update('service_id', dto, 'attacker_id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if service is archived/soft-deleted', async () => {
      const existing = {
        id: 'service_id',
        vendorId: 'vendor_id',
        status: ServiceStatus.ARCHIVED,
      } as Service;
      const dto: UpdateServiceDto = { title: 'New Title' };

      repository.findOneById.mockResolvedValue(existing);

      await expect(
        service.update('service_id', dto, 'vendor_id'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft-delete own service by marking status as ARCHIVED', async () => {
      const existing = {
        id: 'service_id',
        vendorId: 'vendor_id',
        status: ServiceStatus.ACTIVE,
      } as Service;

      repository.findOneById.mockResolvedValue(existing);
      repository.save.mockResolvedValue(existing);

      await service.remove('service_id', 'vendor_id');
      expect(existing.status).toBe(ServiceStatus.ARCHIVED);
      expect(repository.save).toHaveBeenCalledWith(existing);
    });

    it('should throw ForbiddenException if user does not own the listing', async () => {
      const existing = {
        id: 'service_id',
        vendorId: 'owner_id',
        status: ServiceStatus.ACTIVE,
      } as Service;

      repository.findOneById.mockResolvedValue(existing);

      await expect(service.remove('service_id', 'attacker_id')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should act idempotently if service is already archived', async () => {
      const existing = {
        id: 'service_id',
        vendorId: 'vendor_id',
        status: ServiceStatus.ARCHIVED,
      } as Service;

      repository.findOneById.mockResolvedValue(existing);

      await service.remove('service_id', 'vendor_id');
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should successfully return active service', async () => {
      const existing = {
        id: 'service_id',
        status: ServiceStatus.ACTIVE,
      } as Service;

      repository.findOneById.mockResolvedValue(existing);

      const result = await service.findOne('service_id');
      expect(result).toEqual(existing);
    });

    it('should throw NotFoundException if service is archived', async () => {
      const existing = {
        id: 'service_id',
        status: ServiceStatus.ARCHIVED,
      } as Service;

      repository.findOneById.mockResolvedValue(existing);

      await expect(service.findOne('service_id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated and filtered services', async () => {
      const query = new QueryServiceDto();
      const servicesList = [
        { id: 'service_1' },
        { id: 'service_2' },
      ] as Service[];
      repository.findWithFilters.mockResolvedValue([servicesList, 2]);

      const result = await service.findAll(query);
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });
});
