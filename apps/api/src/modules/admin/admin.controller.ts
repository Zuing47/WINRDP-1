import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsString } from 'class-validator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UseGuards } from '@nestjs/common';
import { AdminCatalogService } from './admin-catalog.service';
import { AdminLogsService } from './admin-logs.service';
import { AdminStatsService } from './admin-stats.service';
import { AdminSubscriptionsService } from './admin-subscriptions.service';
import { AdminSystemService } from './admin-system.service';
import { AdminUsersService } from './admin-users.service';
import { UpsertBrandDto, UpsertCategoryDto, UpsertModelDto } from './dto/admin-catalog.dto';
import { ListUsersDto, UpdateUserDto } from './dto/admin-users.dto';

class SetConfigDto {
  @IsString()
  key!: string;

  @IsString()
  value!: string;
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly users: AdminUsersService,
    private readonly subscriptions: AdminSubscriptionsService,
    private readonly logs: AdminLogsService,
    private readonly catalog: AdminCatalogService,
    private readonly stats: AdminStatsService,
    private readonly system: AdminSystemService,
  ) {}

  // ── Usuários ─────────────────────────────────────────────────────
  @Get('users')
  @ApiOperation({ summary: 'Lista usuários (paginado, filtros)' })
  listUsers(@Query() dto: ListUsersDto) {
    return this.users.list(dto);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Altera role/status de um usuário' })
  updateUser(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  // ── Assinaturas ──────────────────────────────────────────────────
  @Get('subscriptions')
  @ApiOperation({ summary: 'Lista assinaturas da plataforma' })
  listSubscriptions(@Query() dto: PaginationDto) {
    return this.subscriptions.list(dto);
  }

  // ── Logs ─────────────────────────────────────────────────────────
  @Get('logs')
  @ApiOperation({ summary: 'Logs de uso da API (paginado)' })
  listLogs(@Query() dto: PaginationDto) {
    return this.logs.list(dto);
  }

  // ── Estatísticas da plataforma ────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Totais, crescimento e avaliações por categoria' })
  platformStats() {
    return this.stats.stats();
  }

  // ── Catálogo: categorias ──────────────────────────────────────────
  @Get('catalog/categories')
  categories() {
    return this.catalog.categories();
  }

  @Post('catalog/categories')
  @ApiBody({ type: UpsertCategoryDto })
  createCategory(@Body() dto: UpsertCategoryDto) {
    return this.catalog.createCategory(dto);
  }

  @Patch('catalog/categories/:id')
  updateCategory(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<UpsertCategoryDto>) {
    return this.catalog.updateCategory(id, dto);
  }

  @Delete('catalog/categories/:id')
  deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.deleteCategory(id);
  }

  // ── Catálogo: marcas ───────────────────────────────────────────────
  @Get('catalog/brands')
  brands() {
    return this.catalog.brands();
  }

  @Post('catalog/brands')
  @ApiBody({ type: UpsertBrandDto })
  createBrand(@Body() dto: UpsertBrandDto) {
    return this.catalog.createBrand(dto);
  }

  @Patch('catalog/brands/:id')
  updateBrand(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<UpsertBrandDto>) {
    return this.catalog.updateBrand(id, dto);
  }

  @Delete('catalog/brands/:id')
  deleteBrand(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.deleteBrand(id);
  }

  // ── Catálogo: modelos ──────────────────────────────────────────────
  @Get('catalog/models')
  models() {
    return this.catalog.models();
  }

  @Post('catalog/models')
  @ApiBody({ type: UpsertModelDto })
  createModel(@Body() dto: UpsertModelDto) {
    return this.catalog.createModel(dto);
  }

  @Patch('catalog/models/:id')
  updateModel(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Partial<UpsertModelDto>) {
    return this.catalog.updateModel(id, dto);
  }

  @Delete('catalog/models/:id')
  deleteModel(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.deleteModel(id);
  }

  // ── Sistema ──────────────────────────────────────────────────────
  @Get('system')
  @ApiOperation({ summary: 'Status de conectores de mercado, providers de IA, filas e cache' })
  systemStatus() {
    return this.system.status();
  }

  @Post('system/cache/clear')
  @ApiOperation({ summary: 'Limpa o cache de busca de mercado no Redis' })
  clearCache() {
    return this.system.clearCache();
  }

  @Get('system/config')
  @ApiOperation({ summary: 'Configurações chave-valor em memória' })
  getConfig() {
    return this.system.getConfig();
  }

  @Post('system/config')
  @ApiOperation({ summary: 'Define uma configuração chave-valor em memória' })
  setConfig(@Body() dto: SetConfigDto) {
    return this.system.setConfig(dto.key, dto.value);
  }
}
