import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ServiceRepository } from '../repositories/service.repository';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class ServiceOwnerGuard implements CanActivate {
  constructor(private readonly serviceRepository: ServiceRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: User; params: { id?: string } }>();
    const user = request.user;
    const serviceId = request.params.id;

    if (!user) {
      throw new ForbiddenException('Authentication context is missing.');
    }

    if (!serviceId) {
      return true; // If no service ID exists in the route parameters, proceed
    }

    const service = await this.serviceRepository.findOneById(serviceId);
    if (!service) {
      throw new NotFoundException('Requested service not found.');
    }

    if (service.vendorId !== user.id) {
      throw new ForbiddenException('You do not own this service catalog item.');
    }

    return true;
  }
}
