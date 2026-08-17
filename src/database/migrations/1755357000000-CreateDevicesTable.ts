import {
  type MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
} from 'typeorm';

export class CreateDevicesTable1755357000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'devices',
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
            name: 'name',
            type: 'varchar',
            length: '120',
            isNullable: false,
          },
          {
            name: 'deviceType',
            type: 'varchar',
            length: '40',
            isNullable: false,
          },
          {
            name: 'nominalPowerKw',
            type: 'float',
            isNullable: false,
          },
          {
            name: 'isFlexible',
            type: 'bit',
            isNullable: false,
            default: '1',
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
            name: 'FK_devices_householdId_households_id',
            columnNames: ['householdId'],
            referencedTableName: 'households',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'devices',
      new TableIndex({
        name: 'IX_devices_householdId',
        columnNames: ['householdId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('devices', 'IX_devices_householdId');
    await queryRunner.dropTable('devices');
  }
}
