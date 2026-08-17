import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from '../devices/entities/device.entity';
import { Household } from '../households/entities/household.entity';
import { ScheduleOptimizationService } from './schedule-optimization.service';
import { Schedule } from './entities/schedule.entity';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule, Household, Device])],
  controllers: [SchedulesController],
  providers: [SchedulesService, ScheduleOptimizationService],
})
export class SchedulesModule {}
