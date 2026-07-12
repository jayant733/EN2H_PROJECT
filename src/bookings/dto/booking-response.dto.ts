import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { BookingStatus } from '../../shared/enums/booking-status.enum';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { ServiceResponseDto } from '../../services/dto/service-response.dto';

export class BookingResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the booking record',
    example: '8b7f525c-cc22-4467-93cf-8a291f97a5fb',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Client identifier (optional)',
    example: '0190a463-b827-7c1d-8bde-d872b7a9ef31',
    required: false,
  })
  @Expose()
  clientId?: string;

  @ApiProperty({
    description: 'Client profile details (optional expansion)',
    type: () => UserResponseDto,
    required: false,
  })
  @Expose()
  @Type(() => UserResponseDto)
  client?: UserResponseDto;

  @ApiProperty({
    description: 'Service identifier',
    example: 'd3b07384-d113-49cd-a5d6-89d020d2d9ff',
  })
  @Expose()
  serviceId!: string;

  @ApiProperty({
    description: 'Service profile details (optional expansion)',
    type: () => ServiceResponseDto,
    required: false,
  })
  @Expose()
  @Type(() => ServiceResponseDto)
  service?: ServiceResponseDto;

  @ApiProperty({
    description: 'Customer full name',
    example: 'Jane Doe',
  })
  @Expose()
  customerName!: string;

  @ApiProperty({
    description: 'Customer email address',
    example: 'jane.doe@example.com',
  })
  @Expose()
  customerEmail!: string;

  @ApiProperty({
    description: 'Customer phone number',
    example: '+1-555-0199',
  })
  @Expose()
  customerPhone!: string;

  @ApiProperty({
    description: 'Scheduled date of booking in YYYY-MM-DD format',
    example: '2026-08-15',
  })
  @Expose()
  bookingDate!: string;

  @ApiProperty({
    description: 'Scheduled time of booking in HH:MM format',
    example: '10:00',
  })
  @Expose()
  bookingTime!: string;

  @ApiProperty({
    description: 'Snapshot cost of service at the time booking was created',
    example: 45.0,
  })
  @Expose()
  priceAtBooking!: number;

  @ApiProperty({
    description: 'State status of reservation',
    enum: BookingStatus,
    example: BookingStatus.PENDING,
  })
  @Expose()
  status!: BookingStatus;

  @ApiProperty({
    description: 'User notes or instructions',
    example: 'Organic styling pomade preferred.',
  })
  @Expose()
  notes?: string;

  @ApiProperty({
    description: 'Timestamp when booking reservation was created',
    example: '2026-07-10T12:00:00.000Z',
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: 'Timestamp of last modification',
    example: '2026-07-10T12:00:00.000Z',
  })
  @Expose()
  updatedAt!: Date;
}
