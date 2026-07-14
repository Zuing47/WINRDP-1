import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get('catalog/categories')
  @ApiOperation({ summary: 'Lista as categorias com atributos dinâmicos' })
  categories() {
    return this.catalog.categories();
  }

  @Public()
  @Get('catalog/brands')
  @ApiOperation({ summary: 'Lista marcas, opcionalmente por categoria' })
  @ApiQuery({ name: 'categoryId', required: false })
  brands(@Query('categoryId') categoryId?: string) {
    return this.catalog.brands(categoryId);
  }

  @Public()
  @Get('catalog/models')
  @ApiOperation({ summary: 'Lista modelos por marca com busca por nome' })
  @ApiQuery({ name: 'brandId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'search', required: false })
  models(
    @Query('brandId') brandId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.catalog.models({ brandId, categoryId, search });
  }

  @Public()
  @Get('models/:id/price-history')
  @ApiOperation({ summary: 'Série temporal de preços do modelo' })
  @ApiQuery({ name: 'days', required: false, example: 90 })
  priceHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('days') days?: string,
  ) {
    return this.catalog.priceHistory(id, Number(days ?? 90));
  }
}
