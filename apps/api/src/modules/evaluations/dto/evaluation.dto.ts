import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EvaluationStatus, ProductCondition } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CreateEvaluationDto {
  @ApiProperty({ description: 'ID do modelo do catálogo' })
  @IsUUID()
  modelId!: string;

  @ApiProperty({ enum: ProductCondition, example: ProductCondition.GOOD })
  @IsEnum(ProductCondition)
  condition!: ProductCondition;

  @ApiPropertyOptional({ example: 2022 })
  @IsOptional()
  @IsInt()
  @Min(1950)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ description: 'Atributos dinâmicos da categoria', example: { capacidade: '256GB', cor: 'Titânio Natural' } })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasInvoice?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasWarranty?: boolean;

  @ApiPropertyOptional({ example: ['carregador original', 'caixa'] })
  @IsOptional()
  @IsArray()
  accessories?: string[];

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @IsString()
  locationCity?: string;

  @ApiPropertyOptional({ example: 'SP', minLength: 2, maxLength: 2 })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  locationState?: string;
}

export class PresignPhotoItemDto {
  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  contentType!: string;
}

export class PresignPhotosDto {
  @ApiProperty({ type: [PresignPhotoItemDto], description: 'Máx. 15 fotos por avaliação' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(15)
  @ValidateNested({ each: true })
  @Type(() => PresignPhotoItemDto)
  photos!: PresignPhotoItemDto[];
}

export class ListEvaluationsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: EvaluationStatus })
  @IsOptional()
  @IsEnum(EvaluationStatus)
  status?: EvaluationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  modelId?: string;

  @ApiPropertyOptional({ description: 'Busca pelo nome do modelo' })
  @IsOptional()
  @IsString()
  search?: string;
}
