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

export class UpdateDeviceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEnum(DeviceType)
  deviceType?: DeviceType;

  @IsOptional()
  @IsNumber()
  @Min(0.000001)
  nominalPowerKw?: number;

  @IsOptional()
  @IsBoolean()
  isFlexible?: boolean;
}
