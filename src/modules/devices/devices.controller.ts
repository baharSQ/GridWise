import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../../common/decorators/current-user.decorator';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { DeviceResponseDto } from './dto/device-response.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@ApiTags('Devices')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('households/:id/devices')
  @ApiOperation({ summary: 'Add a device to a household' })
  @ApiResponse({ status: 201, type: DeviceResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — household belongs to another user',
  })
  @ApiResponse({ status: 404, description: 'Household not found' })
  create(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) householdId: string,
    @Body() dto: CreateDeviceDto,
  ): Promise<DeviceResponseDto> {
    return this.devicesService.createInHousehold(user.userId, householdId, dto);
  }

  @Get('households/:id/devices')
  @ApiOperation({ summary: 'List all devices in a household' })
  @ApiResponse({ status: 200, type: [DeviceResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — household belongs to another user',
  })
  findAll(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) householdId: string,
  ): Promise<DeviceResponseDto[]> {
    return this.devicesService.findAllForHousehold(user.userId, householdId);
  }

  @Patch('devices/:id')
  @ApiOperation({
    summary: 'Update a device (must belong to the authenticated user)',
  })
  @ApiResponse({ status: 200, type: DeviceResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Device not found' })
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) deviceId: string,
    @Body() dto: UpdateDeviceDto,
  ): Promise<DeviceResponseDto> {
    return this.devicesService.updateForUser(user.userId, deviceId, dto);
  }

  @Delete('devices/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a device (must belong to the authenticated user)',
  })
  @ApiResponse({ status: 204, description: 'Device deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async delete(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) deviceId: string,
  ): Promise<void> {
    await this.devicesService.deleteForUser(user.userId, deviceId);
  }
}
