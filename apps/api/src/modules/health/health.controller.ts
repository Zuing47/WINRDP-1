import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../infra/prisma.service';
import { QueueService } from '../../infra/queue.service';
import { RedisService } from '../../infra/redis.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly queue: QueueService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Status de banco, Redis e filas' })
  async check() {
    let db = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'down';
    }
    const redisUp = await this.redis.ping();
    return {
      status: db === 'up' ? 'ok' : 'degraded',
      db,
      redis: redisUp ? 'up' : this.redis.isAvailable ? 'down' : 'unavailable (fallback em memória)',
      queues: {
        mode: this.queue.mode,
        detail: await this.queue.getQueueStatus(),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
