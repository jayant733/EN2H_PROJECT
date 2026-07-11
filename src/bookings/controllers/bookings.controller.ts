import {
  Controller,
  Post,
  Patch,
  Get,
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
import { BookingsService } from '../services/bookings.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingStatusDto } from '../dto/update-booking-status.dto';
import { CancelBookingDto } from '../dto/cancel-booking.dto';
import { QueryBookingDto } from '../dto/query-booking.dto';
import { BookingResponseDto } from '../dto/booking-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../shared/enums/role.enum';
import { plainToInstance } from 'class-transformer';

@ApiTags('Bookings')
@Controller('bookings')
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new service booking reservation (Client only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Booking reservation created successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid DTO input or past dates' })
  @ApiResponse({
    status: 409,
    description: 'Client duplicate or overlapping booking conflicts',
  })
  async create(
    @Body() dto: CreateBookingDto,
    @CurrentUser() user: User | null,
  ): Promise<BookingResponseDto> {
    const clientId = user?.id || '';
    const booking = await this.bookingsService.create(dto, clientId);
    return plainToInstance(BookingResponseDto, booking, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @ApiOperation({
    summary:
      'List and filter booking reservations with pagination (Client context enforced)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of bookings matching search filters',
  })
  async findAll(
    @Query() query: QueryBookingDto,
    @CurrentUser() user: User | null,
  ) {
    const userId = user?.id || '';
    const role = user?.role || UserRole.CLIENT;
    const result = await this.bookingsService.findAll(query, userId, role);
    const serializedData = plainToInstance(BookingResponseDto, result.data, {
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
  @ApiOperation({ summary: 'Retrieve details of a single booking reservation' })
  @ApiResponse({
    status: 200,
    description: 'Detailed booking reservation profile',
    type: BookingResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access to booking details',
  })
  @ApiResponse({ status: 404, description: 'Booking reservation not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User | null,
  ): Promise<BookingResponseDto> {
    const userId = user?.id || '';
    const role = user?.role || UserRole.CLIENT;
    const booking = await this.bookingsService.findOne(id, userId, role);
    return plainToInstance(BookingResponseDto, booking, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Update status of reservation (Owners/Admins only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking reservation status updated successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden update permissions' })
  @ApiResponse({
    status: 409,
    description: 'Invalid state machine transition conflict',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
    @CurrentUser() user: User | null,
  ): Promise<BookingResponseDto> {
    const userId = user?.id || '';
    const role = user?.role || UserRole.CLIENT;
    const booking = await this.bookingsService.updateStatus(
      id,
      dto.status,
      userId,
      role,
      dto.reason,
    );
    return plainToInstance(BookingResponseDto, booking, {
      excludeExtraneousValues: true,
    });
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel booking reservation (Owners/Admins only)' })
  @ApiResponse({
    status: 200,
    description: 'Booking reservation cancelled successfully',
    type: BookingResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot cancel a completed booking',
  })
  async cancel(
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
    @CurrentUser() user: User | null,
  ): Promise<BookingResponseDto> {
    const userId = user?.id || '';
    const role = user?.role || UserRole.CLIENT;
    const booking = await this.bookingsService.cancel(id, dto, userId, role);
    return plainToInstance(BookingResponseDto, booking, {
      excludeExtraneousValues: true,
    });
  }
}
