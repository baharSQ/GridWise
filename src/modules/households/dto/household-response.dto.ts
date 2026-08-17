import { ApiProperty } from '@nestjs/swagger';

export class HouseholdResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ example: 'Smith Household' })
  name!: string;

  @ApiProperty({ example: 'Europe/Helsinki' })
  timezone!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
