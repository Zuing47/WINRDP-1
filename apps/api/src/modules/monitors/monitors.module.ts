import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { MonitorsController } from './monitors.controller';
import { MonitorsService } from './monitors.service';
import { PriceMonitorWorker } from './price-monitor.worker';

@Module({
  imports: [SubscriptionsModule, NotificationsModule],
  controllers: [MonitorsController],
  providers: [MonitorsService, PriceMonitorWorker],
  exports: [PriceMonitorWorker],
})
export class MonitorsModule {}
