import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CancelBookingDto {
  @ApiProperty({
    description: 'Mandatory justification for booking cancellation',
    example: 'Sudden scheduling conflict; need to cancel.',
    minLength: 5,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  reason!: string;
}
