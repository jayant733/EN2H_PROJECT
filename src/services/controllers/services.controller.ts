import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ServicesService } from '../services/services.service';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { QueryServiceDto } from '../dto/query-service.dto';
import { ServiceResponseDto } from '../dto/service-response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ServiceOwnerGuard } from '../guards/service-owner.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { plainToInstance } from 'class-transformer';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Browse and query all active service catalog offerings (Public)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Paginated list of catalog services matched by query parameters',
  })
  async findAll(@Query() query: QueryServiceDto) {
    const result = await this.servicesService.findAll(query);
    const serializedData = plainToInstance(ServiceResponseDto, result.data, {
      excludeExtraneousValues: true,
    });
    return {
      data: serializedData,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Retrieve details of a single service listing (Public)',
  })
  @ApiResponse({
    status: 200,
    description: 'Detailed service catalog item profile',
    type: ServiceResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Service catalog item not found or archived',
  })
  async findOne(@Param('id') id: string): Promise<ServiceResponseDto> {
    const service = await this.servicesService.findOne(id);
    return plainToInstance(ServiceResponseDto, service, {
      excludeExtraneousValues: true,
    });
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Register a new service listing (Vendors only)' })
  @ApiResponse({
    status: 201,
    description: 'Service listing created successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request body parameter schema',
  })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden: Vendors only' })
  async create(
    @Body() dto: CreateServiceDto,
    @CurrentUser() user: User | null,
  ): Promise<ServiceResponseDto> {
    const vendorId = user?.id || '';
    const service = await this.servicesService.create(dto, vendorId);
    return plainToInstance(ServiceResponseDto, service, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(RolesGuard, ServiceOwnerGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({
    summary:
      'Partially update an existing service listing (Service Owner only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Service listing updated successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden: Service Owner only' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({
    status: 409,
    description: 'Cannot update soft-deleted service catalog listings',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
    @CurrentUser() user: User | null,
  ): Promise<ServiceResponseDto> {
    const vendorId = user?.id || '';
    const service = await this.servicesService.update(id, dto, vendorId);
    return plainToInstance(ServiceResponseDto, service, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @UseGuards(RolesGuard, ServiceOwnerGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({
    summary: 'Delete (archive) a service listing (Service Owner only)',
  })
  @ApiResponse({
    status: 204,
    description: 'Service listing deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Forbidden: Service Owner only' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: User | null,
  ): Promise<void> {
    const vendorId = user?.id || '';
    await this.servicesService.remove(id, vendorId);
  }
}
