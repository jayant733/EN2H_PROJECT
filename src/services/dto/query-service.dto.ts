import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryServiceDto {
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
    description: 'Filter services by category name (case-insensitive)',
    required: false,
    example: 'Hair Grooming',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Filter services by active status',
    required: false,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  isActive?: boolean;

  @ApiProperty({
    description:
      'Search string matched against title and description using case-insensitive search',
    required: false,
    example: 'haircut',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Column field name to sort the result list by',
    required: false,
    default: 'createdAt',
    example: 'price',
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
