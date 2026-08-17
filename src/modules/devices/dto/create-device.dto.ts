import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'Tesla Wall Connector', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ enum: DeviceType, example: DeviceType.EV_CHARGER })
  @IsEnum(DeviceType)
  deviceType!: DeviceType;

  @ApiProperty({ example: 11.0, description: 'Rated power in kilowatts' })
  @IsNumber()
  @Min(0.000001)
  nominalPowerKw!: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the device can be rescheduled to avoid overloads',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isFlexible?: boolean;
}
