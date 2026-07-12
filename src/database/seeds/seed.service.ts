import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Service } from '../../services/entities/service.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { UserRole } from '../../shared/enums/role.enum';
import { UserStatus } from '../../shared/enums/user-status.enum';
import { BookingStatus } from '../../shared/enums/booking-status.enum';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly cryptoUtil: CryptoUtil,
  ) {}

  async run(): Promise<void> {
    this.logger.log('Starting database seeding...');

    const userRepository = this.dataSource.getRepository(User);
    const serviceRepository = this.dataSource.getRepository(Service);
    const bookingRepository = this.dataSource.getRepository(Booking);

    // 1. Seed Vendor User
    let vendor = await userRepository.findOne({ where: { email: 'vendor@example.com' } });
    if (!vendor) {
      this.logger.log('Seeding vendor user...');
      const passwordHash = await this.cryptoUtil.hashPassword('Password123!');
      vendor = userRepository.create({
        email: 'vendor@example.com',
        passwordHash,
        fullName: 'EN2H Vendor Partner',
        role: UserRole.VENDOR,
        status: UserStatus.ACTIVE,
      });
      vendor = await userRepository.save(vendor);
      this.logger.log(`Vendor seeded with ID: ${vendor.id}`);
    }

    // 2. Seed Client User
    let client = await userRepository.findOne({ where: { email: 'jane.doe@example.com' } });
    if (!client) {
      this.logger.log('Seeding client user...');
      const passwordHash = await this.cryptoUtil.hashPassword('P@ssword123!');
      client = userRepository.create({
        email: 'jane.doe@example.com',
        passwordHash,
        fullName: 'Jane Doe',
        role: UserRole.CLIENT,
        status: UserStatus.ACTIVE,
      });
      client = await userRepository.save(client);
      this.logger.log(`Client seeded with ID: ${client.id}`);
    }

    // 3. Seed Service Catalog
    let service = await serviceRepository.findOne({ where: { title: 'NestJS Architecture Consulting' } });
    if (!service) {
      this.logger.log('Seeding service catalog...');
      service = serviceRepository.create({
        vendorId: vendor.id,
        title: 'NestJS Architecture Consulting',
        description: 'Deep dive review of modular NestJS design patterns, database integration, and performance optimization.',
        duration: 60,
        price: 150.00,
        category: 'Software Engineering',
        isActive: true,
      });
      service = await serviceRepository.save(service);
      this.logger.log(`Service seeded with ID: ${service.id}`);
    }

    // 4. Seed Booking
    const bookingDate = '2026-08-20';
    const bookingTime = '10:00';
    const existingBooking = await bookingRepository.findOne({
      where: {
        serviceId: service.id,
        bookingDate,
        bookingTime,
      },
    });

    if (!existingBooking) {
      this.logger.log('Seeding booking reservation...');
      const booking = bookingRepository.create({
        serviceId: service.id,
        customerName: 'Alice Smith',
        customerEmail: 'alice.smith@example.com',
        customerPhone: '+1-555-0100',
        bookingDate,
        bookingTime,
        priceAtBooking: service.price,
        status: BookingStatus.PENDING,
        notes: 'Please focus the consulting session on TypeORM connection pool configuration.',
      });
      const savedBooking = await bookingRepository.save(booking);
      this.logger.log(`Booking seeded with ID: ${savedBooking.id}`);
    }

    this.logger.log('Database seeding completed successfully!');
  }
}
