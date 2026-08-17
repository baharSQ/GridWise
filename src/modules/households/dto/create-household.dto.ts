import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateHouseholdDto {
  @ApiProperty({ example: 'Smith Household', maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'Europe/Helsinki', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  timezone!: string;
}
