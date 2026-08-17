import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Household } from '../households/entities/household.entity';
import { Device } from './entities/device.entity';
import { CreateDeviceDto } from './dto/create-device.dto';
import { DeviceResponseDto } from './dto/device-response.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(Household)
    private readonly householdRepository: Repository<Household>,
  ) {}

  async createInHousehold(
    userId: string,
    householdId: string,
    dto: CreateDeviceDto,
  ): Promise<DeviceResponseDto> {
    await this.assertOwnedHousehold(userId, householdId);

    const device = this.deviceRepository.create({
      householdId,
      name: dto.name.trim(),
      deviceType: dto.deviceType,
      nominalPowerKw: dto.nominalPowerKw,
      isFlexible: dto.isFlexible ?? true,
    });
    const savedDevice = await this.deviceRepository.save(device);
    return this.toResponse(savedDevice);
  }

  async findAllForHousehold(
    userId: string,
    householdId: string,
  ): Promise<DeviceResponseDto[]> {
    await this.assertOwnedHousehold(userId, householdId);

    const devices = await this.deviceRepository.find({
      where: { householdId },
      order: { createdAt: 'DESC' },
    });

    return devices.map((device) => this.toResponse(device));
  }

  async updateForUser(
    userId: string,
    deviceId: string,
    dto: UpdateDeviceDto,
  ): Promise<DeviceResponseDto> {
    const device = await this.findOwnedDevice(userId, deviceId);

    if (dto.name !== undefined) {
      device.name = dto.name.trim();
    }
    if (dto.deviceType !== undefined) {
      device.deviceType = dto.deviceType;
    }
    if (dto.nominalPowerKw !== undefined) {
      device.nominalPowerKw = dto.nominalPowerKw;
    }
    if (dto.isFlexible !== undefined) {
      device.isFlexible = dto.isFlexible;
    }

    const updatedDevice = await this.deviceRepository.save(device);
    return this.toResponse(updatedDevice);
  }

  async deleteForUser(userId: string, deviceId: string): Promise<void> {
    const device = await this.findOwnedDevice(userId, deviceId);
    await this.deviceRepository.remove(device);
  }

  private async assertOwnedHousehold(
    userId: string,
    householdId: string,
  ): Promise<void> {
    const household = await this.householdRepository.findOne({
      where: { id: householdId },
    });

    if (!household) {
      throw new NotFoundException('Household not found.');
    }

    if (household.userId !== userId) {
      throw new ForbiddenException('You do not have access to this household.');
    }
  }

  private async findOwnedDevice(
    userId: string,
    deviceId: string,
  ): Promise<Device> {
    const device = await this.deviceRepository.findOne({
      where: { id: deviceId },
    });

    if (!device) {
      throw new NotFoundException('Device not found.');
    }

    await this.assertOwnedHousehold(userId, device.householdId);
    return device;
  }

  private toResponse(device: Device): DeviceResponseDto {
    return {
      id: device.id,
      householdId: device.householdId,
      name: device.name,
      deviceType: device.deviceType,
      nominalPowerKw: device.nominalPowerKw,
      isFlexible: device.isFlexible,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
    };
  }
}
