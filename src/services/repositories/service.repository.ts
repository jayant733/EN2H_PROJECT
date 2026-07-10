import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../entities/service.entity';
import { ServiceStatus } from '../../shared/enums/service-status.enum';

@Injectable()
export class ServiceRepository {
  constructor(
    @InjectRepository(Service)
    private readonly repository: Repository<Service>,
  ) {}

  findOneById(id: string): Promise<Service | null> {
    return this.repository.findOne({ where: { id } });
  }

  findActiveByCategory(
    category: string,
    limit: number,
    skip: number,
  ): Promise<[Service[], number]> {
    return this.repository.findAndCount({
      where: { category, status: ServiceStatus.ACTIVE },
      take: limit,
      skip,
      order: { price: 'ASC' },
    });
  }

  save(service: Partial<Service>): Promise<Service> {
    return this.repository.save(service);
  }
}
