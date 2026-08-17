import {
  type MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
} from 'typeorm';

export class CreateSchedulesTable1755358000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'schedules',
        columns: [
          {
            name: 'id',
            type: 'uniqueidentifier',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'NEWID()',
          },
          {
            name: 'householdId',
            type: 'uniqueidentifier',
            isNullable: false,
          },
          {
            name: 'deviceId',
            type: 'uniqueidentifier',
            isNullable: false,
          },
          {
            name: 'startTime',
            type: 'datetime2',
            isNullable: false,
          },
          {
            name: 'endTime',
            type: 'datetime2',
            isNullable: false,
          },
          {
            name: 'targetPowerKw',
            type: 'float',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            isNullable: false,
            default: `'PENDING'`,
          },
          {
            name: 'createdAt',
            type: 'datetime2',
            default: 'SYSUTCDATETIME()',
          },
          {
            name: 'updatedAt',
            type: 'datetime2',
            default: 'SYSUTCDATETIME()',
          },
        ],
        foreignKeys: [
          {
            name: 'FK_schedules_householdId_households_id',
            columnNames: ['householdId'],
            referencedTableName: 'households',
            referencedColumnNames: ['id'],
            onDelete: 'NO ACTION',
          },
          {
            name: 'FK_schedules_deviceId_devices_id',
            columnNames: ['deviceId'],
            referencedTableName: 'devices',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'schedules',
      new TableIndex({
        name: 'IX_schedules_householdId',
        columnNames: ['householdId'],
      }),
    );
    await queryRunner.createIndex(
      'schedules',
      new TableIndex({
        name: 'IX_schedules_deviceId',
        columnNames: ['deviceId'],
      }),
    );
    await queryRunner.createIndex(
      'schedules',
      new TableIndex({
        name: 'IX_schedules_householdId_startTime',
        columnNames: ['householdId', 'startTime'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('schedules', 'IX_schedules_householdId_startTime');
    await queryRunner.dropIndex('schedules', 'IX_schedules_deviceId');
    await queryRunner.dropIndex('schedules', 'IX_schedules_householdId');
    await queryRunner.dropTable('schedules');
  }
}
