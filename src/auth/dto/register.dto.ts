import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsStrongPassword,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../shared/enums/role.enum';

export class RegisterDto {
  @ApiProperty({
    description: 'Email address of the user (must be unique)',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({
    description:
      'User password (must contain uppercase, lowercase, number, and special character)',
    example: 'SecureP@ss123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password!: string;

  @ApiProperty({
    description: 'Full display name of the user',
    example: 'John Doe',
    minLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  fullName!: string;

  @ApiProperty({
    description: 'Assigned system role determining capabilities',
    enum: UserRole,
    example: UserRole.CLIENT,
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;
}
