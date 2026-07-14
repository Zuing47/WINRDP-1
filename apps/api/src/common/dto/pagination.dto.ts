import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage = 20;

  get skip(): number {
    return (this.page - 1) * this.perPage;
  }
}

export function paginated<T>(items: T[], total: number, dto: PaginationDto) {
  return {
    data: items,
    meta: {
      page: dto.page,
      perPage: dto.perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / dto.perPage)),
    },
  };
}
