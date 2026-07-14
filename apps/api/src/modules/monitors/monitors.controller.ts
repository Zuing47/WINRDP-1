import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateMonitorDto, UpdateMonitorDto } from './dto/monitor.dto';
import { MonitorsService } from './monitors.service';

@ApiTags('monitors')
@ApiBearerAuth()
@Controller('monitors')
export class MonitorsController {
  constructor(private readonly monitors: MonitorsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um monitor de preço' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMonitorDto) {
    return this.monitors.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista os monitores do usuário' })
  list(@CurrentUser() user: AuthUser) {
    return this.monitors.list(user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um monitor' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMonitorDto,
  ) {
    return this.monitors.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um monitor' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.monitors.remove(user.id, id);
  }
}
