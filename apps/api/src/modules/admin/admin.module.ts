import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { MarketModule } from '../market/market.module';
import { AdminCatalogService } from './admin-catalog.service';
import { AdminLogsService } from './admin-logs.service';
import { AdminStatsService } from './admin-stats.service';
import { AdminSubscriptionsService } from './admin-subscriptions.service';
import { AdminSystemService } from './admin-system.service';
import { AdminUsersService } from './admin-users.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [AiModule, MarketModule],
  controllers: [AdminController],
  providers: [
    AdminUsersService,
    AdminSubscriptionsService,
    AdminLogsService,
    AdminCatalogService,
    AdminStatsService,
    AdminSystemService,
  ],
})
export class AdminModule {}
