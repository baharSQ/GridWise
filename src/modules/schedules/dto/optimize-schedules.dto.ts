import { IsNumber, Min } from 'class-validator';

export class OptimizeSchedulesDto {
  @IsNumber()
  @Min(0.000001)
  maxPowerKw!: number;
}
