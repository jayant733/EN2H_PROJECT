import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { BookingStatus } from '../../shared/enums/booking-status.enum';

export class UpdateBookingStatusDto {
  @ApiProperty({
    description: 'Target transition status',
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED,
  })
  @IsEnum(BookingStatus)
  @IsNotEmpty()
  status!: BookingStatus;

  @ApiProperty({
    description: 'Reason explaining the status update (required for audits)',
    example: 'Client requested reschedule via support chat.',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  reason?: string;
}
