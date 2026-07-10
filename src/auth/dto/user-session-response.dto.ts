import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserSessionResponseDto {
  @ApiProperty({
    description: 'Unique session identifier',
    example: '8b7f525c-cc22-4467-93cf-8a291f97a5fb',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'User owner of this session',
    example: '0190a463-b827-7c1d-8bde-d872b7a9ef31',
  })
  @Expose()
  userId!: string;

  @ApiProperty({
    description: 'IP Address where the login occurred',
    example: '192.168.1.1',
  })
  @Expose()
  ipAddress!: string;

  @ApiProperty({
    description: 'User Agent of client browser/device',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...',
  })
  @Expose()
  userAgent!: string;

  @ApiProperty({
    description: 'Expiration date of refresh token credentials',
    example: '2026-08-10T12:00:00.000Z',
  })
  @Expose()
  expiresAt!: Date;

  @ApiProperty({
    description: 'Session creation timestamp',
    example: '2026-07-10T12:00:00.000Z',
  })
  @Expose()
  createdAt!: Date;
}
