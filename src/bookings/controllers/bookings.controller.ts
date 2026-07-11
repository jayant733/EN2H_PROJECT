import {
  Controller,
  Post,
  Patch,
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
import { Public } from '../../common/decorators/public.decorator';
import { BookingOwnerGuard } from '../guards/booking-owner.guard';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingStatusDto } from '../dto/update-booking-status.dto';
import { CancelBookingDto } from '../dto/cancel-booking.dto';
import { BookingResponseDto } from '../dto/booking-response.dto';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  @Post()
  @Public()
  @ApiOperation({
    summary: 'Create a new service booking reservation (Public)',
  })
  @ApiResponse({ status: 201, type: BookingResponseDto })
  create(@Body() dto: CreateBookingDto): BookingResponseDto {
    void dto;
    return {} as unknown as BookingResponseDto;
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(BookingOwnerGuard)
  @ApiOperation({
    summary: 'Update status of reservation (Owners/Admins only)',
  })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ): BookingResponseDto {
    void id;
    void dto;
    return {} as unknown as BookingResponseDto;
  }

  @Post(':id/cancel')
  @ApiBearerAuth()
  @UseGuards(BookingOwnerGuard)
  @ApiOperation({ summary: 'Cancel booking reservation (Owners/Admins only)' })
  @ApiResponse({ status: 200, type: BookingResponseDto })
  cancel(
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ): BookingResponseDto {
    void id;
    void dto;
    return {} as unknown as BookingResponseDto;
  }
}
