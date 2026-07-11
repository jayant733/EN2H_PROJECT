import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus } from '../../shared/enums/booking-status.enum';

export class QueryBookingDto {
  @ApiProperty({
    description: 'Page number for paginated lists',
    required: false,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @ApiProperty({
    description: 'Number of items to return per page (max 100)',
    required: false,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit: number = 10;

  @ApiProperty({
    description:
      'Filter by booking status (e.g. pending, confirmed, cancelled, completed)',
    required: false,
    enum: BookingStatus,
    example: BookingStatus.PENDING,
  })
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @ApiProperty({
    description: 'Filter bookings by client user identifier',
    required: false,
    example: 'd3b07384-d113-49cd-a5d6-89d020d2d9ff',
  })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiProperty({
    description: 'Filter bookings by service identifier',
    required: false,
    example: 'a12bc3de-f456-789a-0123-bcde4567ef89',
  })
  @IsString()
  @IsOptional()
  serviceId?: string;

  @ApiProperty({
    description: 'Query bookings scheduled at or after this date time',
    required: false,
    example: '2026-07-10T12:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  fromDate?: Date;

  @ApiProperty({
    description: 'Query bookings scheduled at or before this date time',
    required: false,
    example: '2026-07-15T12:00:00.000Z',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  toDate?: Date;

  @ApiProperty({
    description: 'Column field name to sort the result list by',
    required: false,
    default: 'createdAt',
    example: 'scheduledAt',
  })
  @IsString()
  @IsOptional()
  sort: string = 'createdAt';

  @ApiProperty({
    description: 'Order direction for query sorting',
    required: false,
    default: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsString()
  @IsOptional()
  order: 'ASC' | 'DESC' = 'DESC';
}
