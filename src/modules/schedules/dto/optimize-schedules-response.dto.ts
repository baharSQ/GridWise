export class ScheduleConflictDto {
  startTime!: string;
  endTime!: string;
  totalRequestedPowerKw!: number;
  powerLimitKw!: number;
  scheduleIds!: string[];
}

export class RecommendedScheduleDto {
  scheduleId!: string;
  deviceId!: string;
  deviceName!: string;
  isFlexible!: boolean;
  originalStartTime!: string;
  originalEndTime!: string;
  recommendedStartTime!: string;
  recommendedEndTime!: string;
  recommendation!: 'KEEP' | 'MOVE_IF_NEEDED' | 'DELAY';
}

export class OptimizeSchedulesResponseDto {
  feasible!: boolean;
  totalRequestedPowerKw!: number;
  powerLimitKw!: number;
  conflicts!: ScheduleConflictDto[];
  recommendedOrder!: string[];
  recommendedSchedules!: RecommendedScheduleDto[];
}
