import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../../common/decorators/current-user.decorator';
import { HouseholdsService } from './households.service';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { HouseholdResponseDto } from './dto/household-response.dto';

@Controller('households')
@UseGuards(JwtAuthGuard)
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateHouseholdDto,
  ): Promise<HouseholdResponseDto> {
    return this.householdsService.create(user.userId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: RequestUser): Promise<HouseholdResponseDto[]> {
    return this.householdsService.findAllForUser(user.userId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<HouseholdResponseDto> {
    return this.householdsService.findOneForUser(user.userId, id);
  }
}
