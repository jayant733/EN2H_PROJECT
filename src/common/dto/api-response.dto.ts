import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponseDto<T> {
  @ApiProperty({
    description: 'Indicates if the API request completed successfully',
    example: true,
  })
  success: boolean = true;

  @ApiProperty({ description: 'The primary response data payload' })
  data!: T;

  @ApiProperty({
    description: 'Response creation ISO timestamp',
    example: '2026-07-10T12:00:00.000Z',
  })
  timestamp: string = new Date().toISOString();
}

export class PaginationMetadata {
  @ApiProperty({ description: 'Current active page number', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Requested item limit per page', example: 10 })
  limit!: number;

  @ApiProperty({
    description: 'Total matched records in the database matching queries',
    example: 125,
  })
  totalItems!: number;

  @ApiProperty({
    description: 'Total calculated pages based on total items and limit',
    example: 13,
  })
  totalPages!: number;

  @ApiProperty({
    description: 'Indicates if a next page exists',
    example: true,
  })
  hasNextPage!: boolean;

  @ApiProperty({
    description: 'Indicates if a previous page exists',
    example: false,
  })
  hasPreviousPage!: boolean;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Indicates if the API request completed successfully',
    example: true,
  })
  success: boolean = true;

  @ApiProperty({ description: 'Array of page item payloads' })
  data!: T[];

  @ApiProperty({ description: 'Pagination schema metadata' })
  meta!: PaginationMetadata;

  @ApiProperty({
    description: 'Response creation ISO timestamp',
    example: '2026-07-10T12:00:00.000Z',
  })
  timestamp: string = new Date().toISOString();
}
