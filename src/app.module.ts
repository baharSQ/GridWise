import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, type TypeOrmModuleOptions } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { HouseholdsModule } from './modules/households/households.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
        type: 'mssql',
        host: configService.getOrThrow<string>('database.host'),
        port: configService.getOrThrow<number>('database.port'),
        database: configService.getOrThrow<string>('database.name'),
        username: configService.getOrThrow<string>('database.username'),
        password: configService.getOrThrow<string>('database.password'),
        autoLoadEntities: true,
        synchronize: false,
        migrationsRun: false,
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      }),
    }),
    AuthModule,
    HouseholdsModule,
    HealthModule,
  ],
})
export class AppModule {}
