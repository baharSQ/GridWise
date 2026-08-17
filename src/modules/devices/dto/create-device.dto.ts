import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { DeviceType } from '../entities/device-type.enum';

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsEnum(DeviceType)
  deviceType!: DeviceType;

  @IsNumber()
  @Min(0.000001)
  nominalPowerKw!: number;

  @IsOptional()
  @IsBoolean()
  isFlexible?: boolean;
}
