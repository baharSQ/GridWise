import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class OptimizeSchedulesDto {
  @ApiProperty({
    example: 20.0,
    description: 'Maximum allowed total power draw in kilowatts',
  })
  @IsNumber()
  @Min(0.000001)
  maxPowerKw!: number;
}
