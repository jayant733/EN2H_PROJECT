import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ServiceStatus } from '../../shared/enums/service-status.enum';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class ServiceResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the service catalog item',
    example: 'd3b07384-d113-49cd-a5d6-89d020d2d9ff',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Vendor owner identifier',
    example: '0190a463-b827-7c1d-8bde-d872b7a9ef31',
  })
  @Expose()
  vendorId!: string;

  @ApiProperty({
    description: 'Vendor profile details (optional expansion)',
    type: () => UserResponseDto,
    required: false,
  })
  @Expose()
  @Type(() => UserResponseDto)
  vendor?: UserResponseDto;

  @ApiProperty({
    description: 'Service display title',
    example: 'Premium Haircut & Styling',
  })
  @Expose()
  title!: string;

  @ApiProperty({
    description: 'Description of service offering',
    example: 'Includes wash, styling, and hot towel service.',
  })
  @Expose()
  description!: string;

  @ApiProperty({
    description: 'Service cost',
    example: 45.0,
  })
  @Expose()
  price!: number;

  @ApiProperty({
    description: 'Duration of service appointment in minutes',
    example: 45,
  })
  @Expose()
  durationMinutes!: number;

  @ApiProperty({
    description: 'Service category grouping',
    example: 'Hair Grooming',
  })
  @Expose()
  category!: string;

  @ApiProperty({
    description: 'State status of the service profile',
    enum: ServiceStatus,
    example: ServiceStatus.ACTIVE,
  })
  @Expose()
  status!: ServiceStatus;

  @ApiProperty({
    description: 'Timestamp when service profile was created',
    example: '2026-07-10T12:00:00.000Z',
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: 'Timestamp of last update',
    example: '2026-07-10T12:00:00.000Z',
  })
  @Expose()
  updatedAt!: Date;
}
