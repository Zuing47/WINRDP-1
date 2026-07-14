import { Module, OnModuleInit } from '@nestjs/common';
import { QUEUES, QueueService } from '../../infra/queue.service';
import { AiModule } from '../ai/ai.module';
import { MarketModule } from '../market/market.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PricingModule } from '../pricing/pricing.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationUseCase } from './use-cases/create-evaluation.use-case';
import { ProcessEvaluationUseCase } from './use-cases/process-evaluation.use-case';
import { SubmitEvaluationUseCase } from './use-cases/submit-evaluation.use-case';

@Module({
  imports: [AiModule, MarketModule, PricingModule, SubscriptionsModule, NotificationsModule],
  controllers: [EvaluationsController],
  providers: [
    EvaluationsService,
    CreateEvaluationUseCase,
    SubmitEvaluationUseCase,
    ProcessEvaluationUseCase,
  ],
})
export class EvaluationsModule implements OnModuleInit {
  constructor(
    private readonly queue: QueueService,
    private readonly processUseCase: ProcessEvaluationUseCase,
  ) {}

  onModuleInit(): void {
    this.queue.registerHandler(QUEUES.EVALUATION_PIPELINE, async (data: { evaluationId: string }) =>
      this.processUseCase.execute(data.evaluationId),
    );
  }
}
