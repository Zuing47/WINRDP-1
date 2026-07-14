import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infra/prisma.service';
import { QUEUES, QueueService } from '../../../infra/queue.service';

@Injectable()
export class SubmitEvaluationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  async execute(userId: string, evaluationId: string) {
    const evaluation = await this.prisma.evaluation.findFirst({
      where: { id: evaluationId, userId },
    });
    if (!evaluation) throw new NotFoundException('Avaliação não encontrada');
    if (evaluation.status !== 'DRAFT' && evaluation.status !== 'FAILED') {
      throw new BadRequestException(`Avaliação já submetida (status ${evaluation.status})`);
    }

    const updated = await this.prisma.evaluation.update({
      where: { id: evaluationId },
      data: { status: 'PENDING', failureReason: null },
    });

    await this.queue.add(QUEUES.EVALUATION_PIPELINE, { evaluationId });
    return updated;
  }
}
