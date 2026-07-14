import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateEvaluationDto, ListEvaluationsDto, PresignPhotosDto } from './dto/evaluation.dto';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationUseCase } from './use-cases/create-evaluation.use-case';
import { SubmitEvaluationUseCase } from './use-cases/submit-evaluation.use-case';

@ApiTags('evaluations')
@ApiBearerAuth()
@Controller('evaluations')
export class EvaluationsController {
  constructor(
    private readonly evaluations: EvaluationsService,
    private readonly createUseCase: CreateEvaluationUseCase,
    private readonly submitUseCase: SubmitEvaluationUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria um rascunho de avaliação' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateEvaluationDto) {
    return this.createUseCase.execute(user.id, dto);
  }

  @Post(':id/photos/presign')
  @HttpCode(200)
  @ApiOperation({ summary: 'Gera URLs pré-assinadas de upload (máx. 15 fotos)' })
  presign(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PresignPhotosDto,
  ) {
    return this.evaluations.presignPhotos(user.id, id, dto);
  }

  @Post(':id/submit')
  @HttpCode(202)
  @ApiOperation({ summary: 'Submete a avaliação e dispara o pipeline assíncrono' })
  submit(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.submitUseCase.execute(user.id, id);
  }

  @Get()
  @ApiOperation({ summary: 'Histórico paginado de avaliações com filtros' })
  list(@CurrentUser() user: AuthUser, @Query() dto: ListEvaluationsDto) {
    return this.evaluations.list(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Status + resultado completo da avaliação' })
  findOne(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.evaluations.findById(user.id, id, user.role === 'ADMIN');
  }

  @Get(':id/breakdown')
  @ApiOperation({ summary: 'Extrato passo a passo da engine de preço' })
  breakdown(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.evaluations.breakdown(user.id, id);
  }
}
