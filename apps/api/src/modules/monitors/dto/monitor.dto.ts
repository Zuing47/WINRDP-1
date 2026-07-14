import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductCondition } from '@prisma/client';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateMonitorDto {
  @ApiProperty()
  @IsUUID()
  modelId!: string;

  @ApiPropertyOptional({ enum: ProductCondition, default: ProductCondition.GOOD })
  @IsOptional()
  @IsEnum(ProductCondition)
  condition?: ProductCondition;

  @ApiPropertyOptional({ description: 'Preço-alvo para alerta de oportunidade' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  targetPrice?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  notifyOnRise?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  notifyOnDrop?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  notifyOnOpportunity?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  notifyOnBigDiscount?: boolean;
}

export class UpdateMonitorDto {
  @ApiPropertyOptional({ enum: ProductCondition })
  @IsOptional()
  @IsEnum(ProductCondition)
  condition?: ProductCondition;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  targetPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyOnRise?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyOnDrop?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyOnOpportunity?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  notifyOnBigDiscount?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
