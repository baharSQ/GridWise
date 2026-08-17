import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('households')
export class Household {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IX_households_userId')
  @Column({ type: 'uniqueidentifier' })
  userId!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  timezone!: string;

  @CreateDateColumn({ type: 'datetime2' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'datetime2' })
  updatedAt!: Date;
}
