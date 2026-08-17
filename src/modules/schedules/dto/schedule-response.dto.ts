import { ApiProperty } from '@nestjs/swagger';
import { ScheduleStatus } from '../entities/schedule-status.enum';

export class ScheduleResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  householdId!: string;

  @ApiProperty()
  deviceId!: string;

  @ApiProperty()
  startTime!: Date;

  @ApiProperty()
  endTime!: Date;

  @ApiProperty({ example: 7.2 })
  targetPowerKw!: number;

  @ApiProperty({ enum: ScheduleStatus })
  status!: ScheduleStatus;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
