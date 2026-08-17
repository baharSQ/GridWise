import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { ScheduleStatus } from '../entities/schedule-status.enum';

export class CreateScheduleDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  deviceId!: string;

  @ApiProperty({ example: '2025-08-18T08:00:00.000Z' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ example: '2025-08-18T10:00:00.000Z' })
  @IsDateString()
  endTime!: string;

  @ApiProperty({ example: 7.2, description: 'Target power in kilowatts' })
  @IsNumber()
  @Min(0.000001)
  targetPowerKw!: number;

  @ApiPropertyOptional({
    enum: ScheduleStatus,
    default: ScheduleStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;
}
