import { ScheduleStatus } from '../entities/schedule-status.enum';

export class ScheduleResponseDto {
  id!: string;
  householdId!: string;
  deviceId!: string;
  startTime!: Date;
  endTime!: Date;
  targetPowerKw!: number;
  status!: ScheduleStatus;
  createdAt!: Date;
  updatedAt!: Date;
}
