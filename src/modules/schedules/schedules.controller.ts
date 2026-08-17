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
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { OptimizeSchedulesDto } from './dto/optimize-schedules.dto';
import { OptimizeSchedulesResponseDto } from './dto/optimize-schedules-response.dto';
import { ScheduleResponseDto } from './dto/schedule-response.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { SchedulesService } from './schedules.service';

@ApiTags('Schedules')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(JwtAuthGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post('households/:id/schedules')
  @ApiOperation({ summary: 'Create a schedule for a device in a household' })
  @ApiResponse({ status: 201, type: ScheduleResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Validation error or startTime >= endTime',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — household belongs to another user',
  })
  create(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) householdId: string,
    @Body() dto: CreateScheduleDto,
  ): Promise<ScheduleResponseDto> {
    return this.schedulesService.createInHousehold(
      user.userId,
      householdId,
      dto,
    );
  }

  @Get('households/:id/schedules')
  @ApiOperation({ summary: 'List all schedules for a household' })
  @ApiResponse({ status: 200, type: [ScheduleResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — household belongs to another user',
  })
  findAll(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) householdId: string,
  ): Promise<ScheduleResponseDto[]> {
    return this.schedulesService.findAllForHousehold(user.userId, householdId);
  }

  @Get('schedules/:id')
  @ApiOperation({ summary: 'Get a schedule by ID' })
  @ApiResponse({ status: 200, type: ScheduleResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  findOne(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) scheduleId: string,
  ): Promise<ScheduleResponseDto> {
    return this.schedulesService.findOneForUser(user.userId, scheduleId);
  }

  @Patch('schedules/:id')
  @ApiOperation({ summary: 'Update a schedule' })
  @ApiResponse({ status: 200, type: ScheduleResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) scheduleId: string,
    @Body() dto: UpdateScheduleDto,
  ): Promise<ScheduleResponseDto> {
    return this.schedulesService.updateForUser(user.userId, scheduleId, dto);
  }

  @Delete('schedules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a schedule' })
  @ApiResponse({ status: 204, description: 'Schedule deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async delete(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) scheduleId: string,
  ): Promise<void> {
    await this.schedulesService.deleteForUser(user.userId, scheduleId);
  }

  @Post('households/:id/schedules/optimize')
  @ApiOperation({
    summary: 'Optimize schedules against a power limit',
    description:
      'Detects time segments where total device power exceeds the given limit. Returns feasibility and a recommended order (flexible devices first).',
  })
  @ApiResponse({ status: 201, type: OptimizeSchedulesResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — household belongs to another user',
  })
  optimize(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) householdId: string,
    @Body() dto: OptimizeSchedulesDto,
  ): Promise<OptimizeSchedulesResponseDto> {
    return this.schedulesService.optimizeForHousehold(
      user.userId,
      householdId,
      dto,
    );
  }
}
