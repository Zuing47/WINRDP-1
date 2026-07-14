import { Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AlertsService } from './alerts.service';

@ApiTags('alerts')
@ApiBearerAuth()
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista alertas dos monitores do usuário' })
  @ApiQuery({ name: 'unread', required: false, type: Boolean })
  list(
    @CurrentUser() user: AuthUser,
    @Query() dto: PaginationDto,
    @Query('unread') unread?: string,
  ) {
    return this.alerts.list(user.id, dto, unread === 'true');
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marca alerta como lido' })
  markRead(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.alerts.markRead(user.id, id);
  }
}
