import { DeviceType } from '../entities/device-type.enum';

export class DeviceResponseDto {
  id!: string;
  householdId!: string;
  name!: string;
  deviceType!: DeviceType;
  nominalPowerKw!: number;
  isFlexible!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
