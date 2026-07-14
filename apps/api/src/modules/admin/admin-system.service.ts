import { Injectable } from '@nestjs/common';
import { QueueService } from '../../infra/queue.service';
import { RedisService } from '../../infra/redis.service';
import { S3Service } from '../../infra/s3.service';
import { AiService } from '../ai/ai.service';
import { MarketSearchService } from '../market/market-search.service';

/** Configurações chave-valor em memória (admin/system). */
const inMemoryConfig = new Map<string, string>([
  ['maintenance_mode', 'false'],
  ['signups_enabled', 'true'],
]);

@Injectable()
export class AdminSystemService {
  constructor(
    private readonly redis: RedisService,
    private readonly queue: QueueService,
    private readonly s3: S3Service,
    private readonly ai: AiService,
    private readonly market: MarketSearchService,
  ) {}

  async status() {
    return {
      redis: { available: this.redis.isAvailable, mode: this.redis.isAvailable ? 'redis' : 'in-memory' },
      queues: { mode: this.queue.mode, detail: await this.queue.getQueueStatus() },
      s3: { configured: this.s3.isConfigured },
      aiProviders: this.ai.providersStatus(),
      marketConnectors: this.market.connectorsStatus(),
    };
  }

  async clearCache(): Promise<{ cleared: number }> {
    const cleared = await this.redis.flush('market:*');
    return { cleared };
  }

  getConfig(): Record<string, string> {
    return Object.fromEntries(inMemoryConfig);
  }

  setConfig(key: string, value: string): Record<string, string> {
    inMemoryConfig.set(key, value);
    return this.getConfig();
  }
}
