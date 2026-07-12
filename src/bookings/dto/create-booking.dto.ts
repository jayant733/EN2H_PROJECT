import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBookingDto {
  @ApiProperty({
    description: 'Target service identifier being reserved',
    example: 'd3b07384-d113-49cd-a5d6-89d020d2d9ff',
  })
  @IsUUID('4')
  @IsNotEmpty()
  serviceId!: string;

  @ApiProperty({
    description: 'Customer full name',
    example: 'Jane Doe',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  customerName!: string;

  @ApiProperty({
    description: 'Customer email address',
    example: 'jane.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  customerEmail!: string;

  @ApiProperty({
    description: 'Customer phone number',
    example: '+1-555-0199',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  customerPhone!: string;

  @ApiProperty({
    description: 'Scheduled date of booking in YYYY-MM-DD format',
    example: '2026-08-15',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'bookingDate must be in YYYY-MM-DD format',
  })
  @IsNotEmpty()
  bookingDate!: string;

  @ApiProperty({
    description: 'Scheduled time of booking in HH:MM format',
    example: '10:00',
  })
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'bookingTime must be in HH:MM format',
  })
  @IsNotEmpty()
  bookingTime!: string;

  @ApiProperty({
    description: 'Optional customer instructions or session notes',
    example: 'Prefer styling with organic pomade if available.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  notes?: string;

  @ApiProperty({
    description: 'Optional unique client-provided idempotency token',
    example: '8b7f525c-cc22-4467-93cf-8a291f97a5fb',
    required: false,
  })
  @IsUUID('4')
  @IsOptional()
  idempotencyKey?: string;
}
