import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Household } from '../households/entities/household.entity';
import { Device } from './entities/device.entity';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';

@Module({
  imports: [TypeOrmModule.forFeature([Device, Household])],
  controllers: [DevicesController],
  providers: [DevicesService],
})
export class DevicesModule {}
