import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserRole } from '../../shared/enums/role.enum';
import { UserStatus } from '../../shared/enums/user-status.enum';

export class UserResponseDto {
  @ApiProperty({
    description: 'Unique system identifier (UUIDv7)',
    example: '0190a463-b827-7c1d-8bde-d872b7a9ef31',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Registered email address',
    example: 'john.doe@example.com',
  })
  @Expose()
  email!: string;

  @ApiProperty({
    description: 'User display name',
    example: 'John Doe',
  })
  @Expose()
  fullName!: string;

  @ApiProperty({
    description: 'Assigned user role',
    enum: UserRole,
    example: UserRole.CLIENT,
  })
  @Expose()
  role!: UserRole;

  @ApiProperty({
    description: 'User account lifecycle status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @Expose()
  status!: UserStatus;

  @ApiProperty({
    description: 'Timestamp when user account was registered',
    example: '2026-07-10T12:00:00.000Z',
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: 'Timestamp of last user profile update',
    example: '2026-07-10T12:00:00.000Z',
  })
  @Expose()
  updatedAt!: Date;
}
