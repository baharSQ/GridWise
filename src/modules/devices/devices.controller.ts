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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../../common/decorators/current-user.decorator';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { DeviceResponseDto } from './dto/device-response.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post('households/:id/devices')
  create(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) householdId: string,
    @Body() dto: CreateDeviceDto,
  ): Promise<DeviceResponseDto> {
    return this.devicesService.createInHousehold(user.userId, householdId, dto);
  }

  @Get('households/:id/devices')
  findAll(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) householdId: string,
  ): Promise<DeviceResponseDto[]> {
    return this.devicesService.findAllForHousehold(user.userId, householdId);
  }

  @Patch('devices/:id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) deviceId: string,
    @Body() dto: UpdateDeviceDto,
  ): Promise<DeviceResponseDto> {
    return this.devicesService.updateForUser(user.userId, deviceId, dto);
  }

  @Delete('devices/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) deviceId: string,
  ): Promise<void> {
    await this.devicesService.deleteForUser(user.userId, deviceId);
  }
}
