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
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { OptimizeSchedulesDto } from './dto/optimize-schedules.dto';
import { OptimizeSchedulesResponseDto } from './dto/optimize-schedules-response.dto';
import { ScheduleResponseDto } from './dto/schedule-response.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { SchedulesService } from './schedules.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post('households/:id/schedules')
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
  findAll(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) householdId: string,
  ): Promise<ScheduleResponseDto[]> {
    return this.schedulesService.findAllForHousehold(user.userId, householdId);
  }

  @Get('schedules/:id')
  findOne(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) scheduleId: string,
  ): Promise<ScheduleResponseDto> {
    return this.schedulesService.findOneForUser(user.userId, scheduleId);
  }

  @Patch('schedules/:id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) scheduleId: string,
    @Body() dto: UpdateScheduleDto,
  ): Promise<ScheduleResponseDto> {
    return this.schedulesService.updateForUser(user.userId, scheduleId, dto);
  }

  @Delete('schedules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) scheduleId: string,
  ): Promise<void> {
    await this.schedulesService.deleteForUser(user.userId, scheduleId);
  }

  @Post('households/:id/schedules/optimize')
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
