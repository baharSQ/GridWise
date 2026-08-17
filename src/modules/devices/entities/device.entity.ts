import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DeviceType } from './device-type.enum';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IX_devices_householdId')
  @Column({ type: 'uniqueidentifier' })
  householdId!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 40 })
  deviceType!: DeviceType;

  @Column({ type: 'float' })
  nominalPowerKw!: number;

  @Column({ type: 'bit', default: true })
  isFlexible!: boolean;

  @CreateDateColumn({ type: 'datetime2' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updatedAt!: Date;
}
