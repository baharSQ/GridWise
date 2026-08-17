import {
  type MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
} from 'typeorm';

export class CreateHouseholdsTable1755356000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'households',
        columns: [
          {
            name: 'id',
            type: 'uniqueidentifier',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'NEWID()',
          },
          {
            name: 'userId',
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
            name: 'timezone',
            type: 'varchar',
            length: '100',
            isNullable: false,
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
            name: 'FK_households_userId_users_id',
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'households',
      new TableIndex({
        name: 'IX_households_userId',
        columnNames: ['userId'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('households', 'IX_households_userId');
    await queryRunner.dropTable('households');
  }
}
