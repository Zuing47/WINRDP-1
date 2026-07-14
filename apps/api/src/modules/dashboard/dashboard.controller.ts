import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'KPIs do usuário (avaliações, economia, monitores, alertas)' })
  stats(@CurrentUser() user: AuthUser) {
    return this.dashboard.stats(user.id);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Série de avaliações por dia (30 dias)' })
  activity(@CurrentUser() user: AuthUser) {
    return this.dashboard.activity(user.id);
  }
}
