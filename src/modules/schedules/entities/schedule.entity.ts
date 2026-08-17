import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ScheduleStatus } from './schedule-status.enum';

@Entity('schedules')
@Index('IX_schedules_householdId_startTime', ['householdId', 'startTime'])
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IX_schedules_householdId')
  @Column({ type: 'uniqueidentifier' })
  householdId!: string;

  @Index('IX_schedules_deviceId')
  @Column({ type: 'uniqueidentifier' })
  deviceId!: string;

  @Column({ type: 'datetime2' })
  startTime!: Date;

  @Column({ type: 'datetime2' })
  endTime!: Date;

  @Column({ type: 'float' })
  targetPowerKw!: number;

  @Column({ type: 'varchar', length: 20, default: ScheduleStatus.PENDING })
  status!: ScheduleStatus;

  @CreateDateColumn({ type: 'datetime2' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updatedAt!: Date;
}
