import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Household } from './entities/household.entity';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { HouseholdResponseDto } from './dto/household-response.dto';

@Injectable()
export class HouseholdsService {
  constructor(
    @InjectRepository(Household)
    private readonly householdRepository: Repository<Household>,
  ) {}

  async create(
    userId: string,
    dto: CreateHouseholdDto,
  ): Promise<HouseholdResponseDto> {
    const household = this.householdRepository.create({
      userId,
      name: dto.name.trim(),
      timezone: dto.timezone.trim(),
    });
    const savedHousehold = await this.householdRepository.save(household);
    return this.toResponse(savedHousehold);
  }

  async findAllForUser(userId: string): Promise<HouseholdResponseDto[]> {
    const households = await this.householdRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return households.map((household) => this.toResponse(household));
  }

  async findOneForUser(
    userId: string,
    householdId: string,
  ): Promise<HouseholdResponseDto> {
    const household = await this.householdRepository.findOne({
      where: { id: householdId },
    });

    if (!household) {
      throw new NotFoundException('Household not found.');
    }

    if (household.userId !== userId) {
      throw new ForbiddenException('You do not have access to this household.');
    }

    return this.toResponse(household);
  }

  private toResponse(household: Household): HouseholdResponseDto {
    return {
      id: household.id,
      userId: household.userId,
      name: household.name,
      timezone: household.timezone,
      createdAt: household.createdAt,
      updatedAt: household.updatedAt,
    };
  }
}
