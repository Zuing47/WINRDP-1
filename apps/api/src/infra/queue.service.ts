import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { RedisService } from './redis.service';

export type JobHandler = (data: any) => Promise<void>;

export const QUEUES = {
  EVALUATION_PIPELINE: 'evaluation-pipeline',
  PRICE_MONITOR: 'price-monitor',
  NOTIFICATIONS: 'notifications',
} as const;

/**
 * Abstração de filas: BullMQ quando o Redis está disponível;
 * caso contrário executa os jobs inline (assíncrono, mesmo processo) —
 * essencial para a demo rodar sem infraestrutura.
 */
@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly handlers = new Map<string, JobHandler>();
  private readonly queues = new Map<string, Queue>();
  private readonly workers = new Map<string, Worker>();

  constructor(private readonly redis: RedisService) {}

  get mode(): 'bullmq' | 'inline' {
    return this.redis.isAvailable ? 'bullmq' : 'inline';
  }

  registerHandler(queueName: string, handler: JobHandler): void {
    this.handlers.set(queueName, handler);
    if (this.redis.isAvailable && this.redis.connection) {
      const connection = this.redis.connection.duplicate({ maxRetriesPerRequest: null });
      const worker = new Worker(
        queueName,
        async (job) => {
          await handler(job.data);
        },
        { connection },
      );
      worker.on('failed', (job, err) =>
        this.logger.error(`Job ${queueName}#${job?.id} falhou: ${err.message}`),
      );
      this.workers.set(queueName, worker);
      this.logger.log(`Worker BullMQ registrado para fila "${queueName}".`);
    } else {
      this.logger.log(`Fila "${queueName}" em modo inline (sem Redis).`);
    }
  }

  async add(queueName: string, data: any): Promise<void> {
    if (this.redis.isAvailable && this.redis.connection) {
      let queue = this.queues.get(queueName);
      if (!queue) {
        queue = new Queue(queueName, {
          connection: this.redis.connection.duplicate({ maxRetriesPerRequest: null }),
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: 100,
            removeOnFail: 500,
          },
        });
        this.queues.set(queueName, queue);
      }
      await queue.add(queueName, data);
      return;
    }
    // Modo inline: executa assíncrono fora do request atual.
    const handler = this.handlers.get(queueName);
    if (!handler) {
      this.logger.warn(`Nenhum handler registrado para fila "${queueName}".`);
      return;
    }
    setImmediate(() => {
      handler(data).catch((err) =>
        this.logger.error(`Job inline "${queueName}" falhou: ${(err as Error).message}`),
      );
    });
  }

  async getQueueStatus(): Promise<Array<{ name: string; mode: string; waiting?: number; active?: number }>> {
    const names = Object.values(QUEUES);
    if (!this.redis.isAvailable) {
      return names.map((name) => ({ name, mode: 'inline' }));
    }
    const result = [];
    for (const name of names) {
      const queue = this.queues.get(name);
      if (queue) {
        const counts = await queue.getJobCounts('waiting', 'active');
        result.push({ name, mode: 'bullmq', waiting: counts.waiting, active: counts.active });
      } else {
        result.push({ name, mode: 'bullmq', waiting: 0, active: 0 });
      }
    }
    return result;
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.workers.values()].map((w) => w.close()));
    await Promise.all([...this.queues.values()].map((q) => q.close()));
  }
}
