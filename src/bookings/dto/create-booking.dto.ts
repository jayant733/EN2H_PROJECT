import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsFutureDate } from '../../common/decorators/is-future-date.decorator';

export class CreateBookingDto {
  @ApiProperty({
    description: 'Target service identifier being reserved',
    example: 'd3b07384-d113-49cd-a5d6-89d020d2d9ff',
  })
  @IsUUID('4')
  @IsNotEmpty()
  serviceId!: string;

  @ApiProperty({
    description:
      'Target appointment date and start time (must be in the future)',
    example: '2026-08-15T10:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  @IsFutureDate()
  scheduledAt!: string;

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
    description:
      'Unique client-provided idempotency token to prevent double submissions',
    example: '8b7f525c-cc22-4467-93cf-8a291f97a5fb',
  })
  @IsUUID('4')
  @IsNotEmpty()
  idempotencyKey!: string;
}
