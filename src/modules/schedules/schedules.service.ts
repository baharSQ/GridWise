import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Device } from '../devices/entities/device.entity';
import { Household } from '../households/entities/household.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { OptimizeSchedulesDto } from './dto/optimize-schedules.dto';
import { OptimizeSchedulesResponseDto } from './dto/optimize-schedules-response.dto';
import { ScheduleResponseDto } from './dto/schedule-response.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ScheduleOptimizationService } from './schedule-optimization.service';
import { Schedule } from './entities/schedule.entity';
import { ScheduleStatus } from './entities/schedule-status.enum';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(Household)
    private readonly householdRepository: Repository<Household>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    private readonly optimizationService: ScheduleOptimizationService,
  ) {}

  async createInHousehold(
    userId: string,
    householdId: string,
    dto: CreateScheduleDto,
  ): Promise<ScheduleResponseDto> {
    await this.assertOwnedHousehold(userId, householdId);

    const device = await this.findDeviceForSchedule(dto.deviceId);
    await this.assertDeviceAssignableToHousehold(userId, householdId, device);

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    this.assertStartBeforeEnd(startTime, endTime);

    const schedule = this.scheduleRepository.create({
      householdId,
      deviceId: dto.deviceId,
      startTime,
      endTime,
      targetPowerKw: dto.targetPowerKw,
      status: dto.status ?? ScheduleStatus.PENDING,
    });
    const saved = await this.scheduleRepository.save(schedule);
    return this.toResponse(saved);
  }

  async findAllForHousehold(
    userId: string,
    householdId: string,
  ): Promise<ScheduleResponseDto[]> {
    await this.assertOwnedHousehold(userId, householdId);

    const schedules = await this.scheduleRepository.find({
      where: { householdId },
      order: { startTime: 'ASC', createdAt: 'ASC' },
    });

    return schedules.map((schedule) => this.toResponse(schedule));
  }

  async findOneForUser(
    userId: string,
    scheduleId: string,
  ): Promise<ScheduleResponseDto> {
    const schedule = await this.findScheduleOrThrow(scheduleId);
    await this.assertOwnedHousehold(userId, schedule.householdId);
    return this.toResponse(schedule);
  }

  async updateForUser(
    userId: string,
    scheduleId: string,
    dto: UpdateScheduleDto,
  ): Promise<ScheduleResponseDto> {
    const schedule = await this.findScheduleOrThrow(scheduleId);
    await this.assertOwnedHousehold(userId, schedule.householdId);

    const nextStartTime = dto.startTime
      ? new Date(dto.startTime)
      : schedule.startTime;
    const nextEndTime = dto.endTime ? new Date(dto.endTime) : schedule.endTime;
    this.assertStartBeforeEnd(nextStartTime, nextEndTime);

    if (dto.startTime) {
      schedule.startTime = nextStartTime;
    }
    if (dto.endTime) {
      schedule.endTime = nextEndTime;
    }
    if (dto.targetPowerKw !== undefined) {
      schedule.targetPowerKw = dto.targetPowerKw;
    }
    if (dto.status) {
      schedule.status = dto.status;
    }

    const updated = await this.scheduleRepository.save(schedule);
    return this.toResponse(updated);
  }

  async deleteForUser(userId: string, scheduleId: string): Promise<void> {
    const schedule = await this.findScheduleOrThrow(scheduleId);
    await this.assertOwnedHousehold(userId, schedule.householdId);
    await this.scheduleRepository.remove(schedule);
  }

  async optimizeForHousehold(
    userId: string,
    householdId: string,
    dto: OptimizeSchedulesDto,
  ): Promise<OptimizeSchedulesResponseDto> {
    await this.assertOwnedHousehold(userId, householdId);

    const schedules = await this.scheduleRepository.find({
      where: {
        householdId,
        status: In([ScheduleStatus.PENDING, ScheduleStatus.ACTIVE]),
      },
      order: { startTime: 'ASC', createdAt: 'ASC' },
    });
    const devices = await this.deviceRepository.find({
      where: { householdId },
    });
    const devicesById = new Map(devices.map((device) => [device.id, device]));

    return this.optimizationService.optimize(
      schedules,
      devicesById,
      dto.maxPowerKw,
    );
  }

  private async assertOwnedHousehold(
    userId: string,
    householdId: string,
  ): Promise<void> {
    const household = await this.householdRepository.findOne({
      where: { id: householdId },
    });

    if (!household) {
      throw new NotFoundException('Household not found.');
    }

    if (household.userId !== userId) {
      throw new ForbiddenException('You do not have access to this household.');
    }
  }

  private async findDeviceForSchedule(deviceId: string): Promise<Device> {
    const device = await this.deviceRepository.findOne({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundException('Device not found.');
    }

    return device;
  }

  private async assertDeviceAssignableToHousehold(
    userId: string,
    householdId: string,
    device: Device,
  ): Promise<void> {
    if (device.householdId === householdId) {
      return;
    }

    await this.assertOwnedHousehold(userId, device.householdId);
    throw new BadRequestException(
      'Device does not belong to the selected household.',
    );
  }

  private async findScheduleOrThrow(scheduleId: string): Promise<Schedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found.');
    }

    return schedule;
  }

  private assertStartBeforeEnd(startTime: Date, endTime: Date): void {
    if (startTime.getTime() >= endTime.getTime()) {
      throw new BadRequestException('startTime must be before endTime.');
    }
  }

  private toResponse(schedule: Schedule): ScheduleResponseDto {
    return {
      id: schedule.id,
      householdId: schedule.householdId,
      deviceId: schedule.deviceId,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      targetPowerKw: schedule.targetPowerKw,
      status: schedule.status,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
    };
  }
}
