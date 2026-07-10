import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsPositive,
  IsInt,
  Min,
  MaxLength,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ServiceStatus } from '../../shared/enums/service-status.enum';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Title of the offered service',
    example: 'Premium Haircut & Styling',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  title!: string;

  @ApiProperty({
    description: 'Detailed description of what the service includes',
    example:
      'Includes wash, custom styling, hot towel treatment, and head massage.',
    minLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  description!: string;

  @ApiProperty({
    description: 'Cost of the service (must be positive)',
    example: 45.0,
    minimum: 0.01,
  })
  @Type(() => Number)
  @IsPositive()
  @Min(0.01)
  price!: number;

  @ApiProperty({
    description:
      'Duration of the service appointment in minutes (minimum 15 mins)',
    example: 45,
    minimum: 15,
  })
  @Type(() => Number)
  @IsInt()
  @Min(15)
  durationMinutes!: number;

  @ApiProperty({
    description: 'General category classification for query grouping',
    example: 'Hair Grooming',
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  category!: string;

  @ApiProperty({
    description: 'Initial state of the service profile',
    enum: ServiceStatus,
    default: ServiceStatus.DRAFT,
    required: false,
  })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status: ServiceStatus = ServiceStatus.DRAFT;
}
