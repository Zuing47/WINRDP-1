import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SubscriptionsService } from './subscriptions.service';

class SubscribeDto {
  @ApiProperty({ description: 'ID do plano' })
  @IsUUID()
  planId!: string;
}

@ApiTags('subscriptions')
@Controller()
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Lista os planos disponíveis' })
  plans() {
    return this.subscriptions.plans();
  }

  @Get('subscriptions/current')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assinatura atual do usuário (Free por padrão)' })
  current(@CurrentUser() user: AuthUser) {
    return this.subscriptions.current(user.id);
  }

  @Post('subscriptions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assina um plano (gateway mock — ativa direto)' })
  subscribe(@CurrentUser() user: AuthUser, @Body() dto: SubscribeDto) {
    return this.subscriptions.subscribe(user.id, dto.planId);
  }
}
