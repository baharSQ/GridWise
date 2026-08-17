import { ApiProperty } from '@nestjs/swagger';
import { DeviceType } from '../entities/device-type.enum';

export class DeviceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  householdId!: string;

  @ApiProperty({ example: 'Tesla Wall Connector' })
  name!: string;

  @ApiProperty({ enum: DeviceType })
  deviceType!: DeviceType;

  @ApiProperty({ example: 11.0 })
  nominalPowerKw!: number;

  @ApiProperty({ example: true })
  isFlexible!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
