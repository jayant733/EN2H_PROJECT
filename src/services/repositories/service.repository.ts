import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../entities/service.entity';
import { ServiceStatus } from '../../shared/enums/service-status.enum';
import { QueryServiceDto } from '../dto/query-service.dto';

@Injectable()
export class ServiceRepository {
  constructor(
    @InjectRepository(Service)
    private readonly repository: Repository<Service>,
  ) {}

  async findOneById(id: string): Promise<Service | null> {
    return this.repository.findOne({
      where: { id },
      relations: { vendor: true },
    });
  }

  async findWithFilters(dto: QueryServiceDto): Promise<[Service[], number]> {
    const qb = this.repository.createQueryBuilder('service');

    // Resolve N+1 issues by joining vendor details in a single query
    qb.leftJoinAndSelect('service.vendor', 'vendor');

    // Enforce soft-delete exclusion boundary
    qb.andWhere('service.status != :archivedStatus', {
      archivedStatus: ServiceStatus.ARCHIVED,
    });

    if (dto.category) {
      qb.andWhere('LOWER(service.category) = LOWER(:category)', {
        category: dto.category.trim(),
      });
    }

    if (dto.status) {
      qb.andWhere('service.status = :status', { status: dto.status });
    }

    if (dto.search) {
      const searchPattern = `%${dto.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(service.title) LIKE :searchPattern OR LOWER(service.description) LIKE :searchPattern)',
        { searchPattern },
      );
    }

    // Whitelist columns for sorting to prevent dynamic SQL injection attacks
    const allowedSortFields = [
      'createdAt',
      'price',
      'durationMinutes',
      'title',
      'category',
    ];
    const resolvedSortField = allowedSortFields.includes(dto.sort)
      ? `service.${dto.sort}`
      : 'service.createdAt';

    qb.orderBy(resolvedSortField, dto.order);

    // Apply pagination skip/take boundaries
    qb.take(dto.limit);
    qb.skip((dto.page - 1) * dto.limit);

    return qb.getManyAndCount();
  }

  async save(service: Partial<Service>): Promise<Service> {
    return this.repository.save(service);
  }
}
