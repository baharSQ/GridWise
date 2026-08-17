import { ApiProperty } from '@nestjs/swagger';

export class ScheduleConflictDto {
  @ApiProperty()
  startTime!: string;

  @ApiProperty()
  endTime!: string;

  @ApiProperty()
  totalRequestedPowerKw!: number;

  @ApiProperty()
  powerLimitKw!: number;

  @ApiProperty({ type: [String] })
  scheduleIds!: string[];
}

export class RecommendedScheduleDto {
  @ApiProperty()
  scheduleId!: string;

  @ApiProperty()
  deviceId!: string;

  @ApiProperty()
  deviceName!: string;

  @ApiProperty()
  isFlexible!: boolean;

  @ApiProperty()
  originalStartTime!: string;

  @ApiProperty()
  originalEndTime!: string;

  @ApiProperty()
  recommendedStartTime!: string;

  @ApiProperty()
  recommendedEndTime!: string;

  @ApiProperty({ enum: ['KEEP', 'MOVE_IF_NEEDED', 'DELAY'] })
  recommendation!: 'KEEP' | 'MOVE_IF_NEEDED' | 'DELAY';
}

export class OptimizeSchedulesResponseDto {
  @ApiProperty({
    description: 'True when no schedule segment exceeds the power limit',
  })
  feasible!: boolean;

  @ApiProperty()
  totalRequestedPowerKw!: number;

  @ApiProperty()
  powerLimitKw!: number;

  @ApiProperty({ type: [ScheduleConflictDto] })
  conflicts!: ScheduleConflictDto[];

  @ApiProperty({
    type: [String],
    description: 'Schedule IDs in recommended execution order',
  })
  recommendedOrder!: string[];

  @ApiProperty({ type: [RecommendedScheduleDto] })
  recommendedSchedules!: RecommendedScheduleDto[];
}
