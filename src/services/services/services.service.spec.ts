import { Test, TestingModule } from '@nestjs/testing';
import { ServicesService } from './services.service';
import { ServiceRepository } from '../repositories/service.repository';
import { Service } from '../entities/service.entity';
import {
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { QueryServiceDto } from '../dto/query-service.dto';

describe('ServicesService', () => {
  let service: ServicesService;
  let repository: jest.Mocked<
    Pick<ServiceRepository, 'findOneById' | 'findWithFilters' | 'save' | 'create'>
  >;

  beforeEach(async () => {
    const mockRepository = {
      findOneById: jest.fn(),
      findWithFilters: jest.fn(),
      save: jest.fn(),
      create: jest.fn((x) => x),
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
        duration: 60,
        category: 'Wellness',
        isActive: true,
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
        isActive: true,
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
        isActive: true,
      } as Service;
      const dto: UpdateServiceDto = { title: 'New Title' };

      repository.findOneById.mockResolvedValue(existing);

      await expect(
        service.update('service_id', dto, 'attacker_id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if service is soft-deleted/archived', async () => {
      const existing = {
        id: 'service_id',
        vendorId: 'vendor_id',
        deletedAt: new Date(),
        isActive: false,
      } as Service;
      const dto: UpdateServiceDto = { title: 'New Title' };

      repository.findOneById.mockResolvedValue(existing);

      await expect(
        service.update('service_id', dto, 'vendor_id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete own service by marking isActive as false and setting deletedAt', async () => {
      const existing = {
        id: 'service_id',
        vendorId: 'vendor_id',
        isActive: true,
      } as Service;

      repository.findOneById.mockResolvedValue(existing);
      repository.save.mockResolvedValue(existing);

      await service.remove('service_id', 'vendor_id');
      expect(existing.isActive).toBe(false);
      expect(existing.deletedAt).toBeInstanceOf(Date);
      expect(repository.save).toHaveBeenCalledWith(existing);
    });

    it('should throw ForbiddenException if user does not own the listing', async () => {
      const existing = {
        id: 'service_id',
        vendorId: 'owner_id',
        isActive: true,
      } as Service;

      repository.findOneById.mockResolvedValue(existing);

      await expect(service.remove('service_id', 'attacker_id')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if service is already soft-deleted', async () => {
      const existing = {
        id: 'service_id',
        vendorId: 'vendor_id',
        deletedAt: new Date(),
        isActive: false,
      } as Service;

      repository.findOneById.mockResolvedValue(existing);

      await expect(service.remove('service_id', 'vendor_id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('should successfully return active service', async () => {
      const existing = {
        id: 'service_id',
        isActive: true,
      } as Service;

      repository.findOneById.mockResolvedValue(existing);

      const result = await service.findOne('service_id');
      expect(result).toEqual(existing);
    });

    it('should throw NotFoundException if service is soft-deleted', async () => {
      const existing = {
        id: 'service_id',
        deletedAt: new Date(),
        isActive: false,
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
