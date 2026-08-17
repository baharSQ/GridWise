import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Household } from './entities/household.entity';
import { HouseholdsService } from './households.service';
import { HouseholdsController } from './households.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Household])],
  providers: [HouseholdsService],
  controllers: [HouseholdsController],
})
export class HouseholdsModule {}
