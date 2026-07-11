import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BookingRepository } from '../repositories/booking.repository';
import { User } from '../../users/entities/user.entity';
import { UserRole } from '../../shared/enums/role.enum';

@Injectable()
export class BookingOwnerGuard implements CanActivate {
  constructor(private readonly bookingRepository: BookingRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: User; params: { id?: string } }>();
    const user = request.user;
    const bookingId = request.params.id;

    if (!user) {
      throw new ForbiddenException('Authentication context is missing.');
    }

    if (!bookingId) {
      return true;
    }

    const booking = await this.bookingRepository.findOneById(bookingId);
    if (!booking) {
      throw new NotFoundException('Requested booking not found.');
    }

    // Access control: client owner, service vendor owner, or admin
    const isClientOwner = booking.clientId === user.id;
    const isVendorOwner = booking.service?.vendorId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isClientOwner && !isVendorOwner && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to access or modify this booking.',
      );
    }

    return true;
  }
}
