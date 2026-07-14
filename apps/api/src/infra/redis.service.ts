import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface MemoryEntry {
  value: string;
  expiresAt: number | null;
}

/**
 * Cache com Redis quando REDIS_URL está disponível e fallback
 * transparente em memória quando não está — o app SEMPRE sobe.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private available = false;
  private readonly memory = new Map<string, MemoryEntry>();

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.get<string>('redisUrl');
    if (!url) {
      this.logger.warn('REDIS_URL ausente — usando cache em memória (modo demo).');
      return;
    }
    try {
      const client = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
        retryStrategy: () => null,
      });
      client.on('error', () => undefined); // evita crash por unhandled error
      await client.connect();
      await client.ping();
      this.client = client;
      this.available = true;
      this.logger.log('Conectado ao Redis.');
    } catch (err) {
      this.logger.warn(
        `Redis indisponível (${(err as Error).message}) — usando cache em memória.`,
      );
      this.client?.disconnect();
      this.client = null;
      this.available = false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.client?.disconnect();
  }

  get isAvailable(): boolean {
    return this.available;
  }

  /** Conexão bruta (para BullMQ). Null quando Redis não está disponível. */
  get connection(): Redis | null {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    if (this.client) return this.client.get(key);
    const entry = this.memory.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt < Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.client) {
      if (ttlSeconds) await this.client.set(key, value, 'EX', ttlSeconds);
      else await this.client.set(key, value);
      return;
    }
    this.memory.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  async del(key: string): Promise<void> {
    if (this.client) {
      await this.client.del(key);
      return;
    }
    this.memory.delete(key);
  }

  async flush(pattern?: string): Promise<number> {
    if (this.client) {
      if (!pattern) {
        await this.client.flushdb();
        return -1;
      }
      const keys = await this.client.keys(pattern);
      if (keys.length) await this.client.del(...keys);
      return keys.length;
    }
    if (!pattern) {
      const n = this.memory.size;
      this.memory.clear();
      return n;
    }
    const regex = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
    let n = 0;
    for (const key of Array.from(this.memory.keys())) {
      if (regex.test(key)) {
        this.memory.delete(key);
        n += 1;
      }
    }
    return n;
  }

  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }
}
