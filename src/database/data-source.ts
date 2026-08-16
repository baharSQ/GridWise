import 'dotenv/config';
import { DataSource } from 'typeorm';
import configuration from '../config/configuration';

const config = configuration();

export default new DataSource({
  type: 'mssql',
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.name,
  synchronize: false,
  migrationsTableName: 'migrations',
  entities: ['src/**/*.entity.ts', 'dist/**/*.entity.js'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
});
