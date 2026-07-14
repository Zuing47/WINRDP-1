import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class UpsertCategoryDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() slug!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() icon?: string;
  @ApiPropertyOptional() @IsOptional() @IsObject() attributesSchema?: unknown;
  @ApiPropertyOptional() @IsOptional() defaultAnnualDepreciation?: number;
}

export class UpsertBrandDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() slug!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() logoUrl?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() categoryIds?: string[];
}

export class UpsertModelDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() slug!: string;
  @ApiProperty() @IsString() brandId!: string;
  @ApiProperty() @IsString() categoryId!: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() releaseYear?: number;
  @ApiPropertyOptional() @IsOptional() @Min(0) msrp?: number;
  @ApiPropertyOptional() @IsOptional() @IsObject() specs?: unknown;
}
