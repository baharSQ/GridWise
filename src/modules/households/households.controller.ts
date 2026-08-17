import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentUser,
  type RequestUser,
} from '../../common/decorators/current-user.decorator';
import { HouseholdsService } from './households.service';
import { CreateHouseholdDto } from './dto/create-household.dto';
import { HouseholdResponseDto } from './dto/household-response.dto';

@ApiTags('Households')
@ApiBearerAuth('access-token')
@Controller('households')
@UseGuards(JwtAuthGuard)
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new household for the authenticated user',
  })
  @ApiResponse({ status: 201, type: HouseholdResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateHouseholdDto,
  ): Promise<HouseholdResponseDto> {
    return this.householdsService.create(user.userId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all households belonging to the authenticated user',
  })
  @ApiResponse({ status: 200, type: [HouseholdResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@CurrentUser() user: RequestUser): Promise<HouseholdResponseDto[]> {
    return this.householdsService.findAllForUser(user.userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a household by ID (must belong to the authenticated user)',
  })
  @ApiResponse({ status: 200, type: HouseholdResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — household belongs to another user',
  })
  @ApiResponse({ status: 404, description: 'Household not found' })
  findOne(
    @CurrentUser() user: RequestUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<HouseholdResponseDto> {
    return this.householdsService.findOneForUser(user.userId, id);
  }
}
