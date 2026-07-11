import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../shared/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ServiceOwnerGuard } from '../guards/service-owner.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { ServiceResponseDto } from '../dto/service-response.dto';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  @Get()
  @Public()
  @ApiOperation({ summary: 'Browse all active service items (Public)' })
  @ApiResponse({ status: 200, type: [ServiceResponseDto] })
  findAll(): ServiceResponseDto[] {
    return [] as ServiceResponseDto[];
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Create a new service listing (Vendors only)' })
  @ApiResponse({ status: 201, type: ServiceResponseDto })
  create(@Body() dto: CreateServiceDto): ServiceResponseDto {
    void dto;
    return {} as unknown as ServiceResponseDto;
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(RolesGuard, ServiceOwnerGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({
    summary: 'Update an existing service listing (Service Owner only)',
  })
  @ApiResponse({ status: 200, type: ServiceResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ): ServiceResponseDto {
    void id;
    void dto;
    return {} as unknown as ServiceResponseDto;
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(RolesGuard, ServiceOwnerGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Delete a service listing (Service Owner only)' })
  @ApiResponse({ status: 204 })
  remove(@Param('id') id: string): void {
    void id;
    return;
  }
}
