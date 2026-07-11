import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ServiceRepository } from '../repositories/service.repository';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { QueryServiceDto } from '../dto/query-service.dto';
import { Service } from '../entities/service.entity';
import { ServiceStatus } from '../../shared/enums/service-status.enum';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(private readonly serviceRepository: ServiceRepository) {}

  async create(dto: CreateServiceDto, vendorId: string): Promise<Service> {
    const service = await this.serviceRepository.save({
      ...dto,
      vendorId,
      status: dto.status || ServiceStatus.DRAFT,
    });

    this.logger.log(`Service created: ${service.id} by vendor ${vendorId}`);
    return service;
  }

  async update(
    id: string,
    dto: UpdateServiceDto,
    vendorId: string,
  ): Promise<Service> {
    const service = await this.serviceRepository.findOneById(id);

    if (!service) {
      this.logger.warn(`Update failed: Service ${id} not found`);
      throw new NotFoundException('Requested service catalog item not found.');
    }

    if (service.vendorId !== vendorId) {
      this.logger.warn(
        `Unauthorized update attempt on service ${id} by user ${vendorId}`,
      );
      throw new ForbiddenException(
        'You do not have permission to modify this service listing.',
      );
    }

    if (service.status === ServiceStatus.ARCHIVED) {
      this.logger.warn(`Update failed: Service ${id} is soft-deleted/archived`);
      throw new ConflictException(
        'Cannot update an archived or soft-deleted service listing.',
      );
    }

    const updatedService = await this.serviceRepository.save({
      ...service,
      ...dto,
    });

    this.logger.log(`Service updated: ${id} by vendor ${vendorId}`);
    return updatedService;
  }

  async remove(id: string, vendorId: string): Promise<void> {
    const service = await this.serviceRepository.findOneById(id);

    if (!service) {
      this.logger.warn(`Soft delete failed: Service ${id} not found`);
      throw new NotFoundException('Requested service catalog item not found.');
    }

    if (service.vendorId !== vendorId) {
      this.logger.warn(
        `Unauthorized delete attempt on service ${id} by user ${vendorId}`,
      );
      throw new ForbiddenException(
        'You do not have permission to delete this service listing.',
      );
    }

    if (service.status === ServiceStatus.ARCHIVED) {
      this.logger.log(`Service ${id} is already archived (idempotent remove)`);
      return;
    }

    service.status = ServiceStatus.ARCHIVED;
    await this.serviceRepository.save(service);

    this.logger.log(
      `Service soft-deleted (archived): ${id} by vendor ${vendorId}`,
    );
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOneById(id);

    if (!service || service.status === ServiceStatus.ARCHIVED) {
      throw new NotFoundException('Requested service catalog item not found.');
    }

    return service;
  }

  async findAll(query: QueryServiceDto): Promise<{
    data: Service[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.serviceRepository.findWithFilters(query);
    return {
      data,
      total,
      page: query.page,
      limit: query.limit,
    };
  }
}
