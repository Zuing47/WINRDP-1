import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../infra/redis.service';
import {
  MARKETPLACE_CONNECTORS,
  MarketplaceConnector,
  MarketSearchQuery,
  RawListing,
} from './connectors/marketplace-connector.interface';
import { FilteredListing, ListingFilterChain } from './filters/listing-filter-chain';
import { MarketStats, MarketStatsCalculator } from './stats/market-stats.calculator';

export interface MarketSearchResult {
  listings: FilteredListing[];
  stats: MarketStats;
  fromCache: boolean;
  connectorsUsed: string[];
}

const CONNECTOR_TIMEOUT_MS = 8000;

@Injectable()
export class MarketSearchService {
  private readonly logger = new Logger(MarketSearchService.name);
  private readonly filterChain = new ListingFilterChain();
  private readonly statsCalculator = new MarketStatsCalculator();

  constructor(
    @Inject(MARKETPLACE_CONNECTORS) private readonly connectors: MarketplaceConnector[],
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  connectorsStatus(): Array<{ marketplace: string; mode: string }> {
    return this.connectors.map((c) => ({ marketplace: c.marketplace, mode: 'simulated' }));
  }

  /** Chave normalizada categoria:marca:modelo:condição — cache 6h. */
  private cacheKey(query: MarketSearchQuery): string {
    const norm = (s: string): string => s.toLowerCase().replace(/\s+/g, '-');
    return `market:${norm(query.categorySlug)}:${norm(query.brandName)}:${norm(query.modelName)}:${norm(query.condition)}`;
  }

  async search(query: MarketSearchQuery): Promise<MarketSearchResult> {
    const key = this.cacheKey(query);
    const cached = await this.redis.get(key);
    if (cached) {
      const parsed = JSON.parse(cached) as Omit<MarketSearchResult, 'fromCache'>;
      return { ...parsed, fromCache: true };
    }

    // fan-out paralelo com timeout individual por conector
    const settled = await Promise.allSettled(
      this.connectors.map((c) => this.withTimeout(c.search(query), CONNECTOR_TIMEOUT_MS, c.marketplace)),
    );
    const raw: RawListing[] = [];
    const connectorsUsed: string[] = [];
    settled.forEach((res, i) => {
      if (res.status === 'fulfilled') {
        raw.push(...res.value);
        connectorsUsed.push(this.connectors[i].marketplace);
      } else {
        this.logger.warn(`Conector ${this.connectors[i].marketplace} falhou: ${res.reason}`);
      }
    });

    const listings = this.filterChain.apply(raw, query);
    const validPrices = listings.filter((l) => !l.excludedReason).map((l) => l.price);
    const stats = this.statsCalculator.calculate(validPrices);

    const result = { listings, stats, connectorsUsed };
    const ttl = this.config.get<number>('marketCacheTtl') ?? 21600;
    await this.redis.set(key, JSON.stringify(result), ttl);
    return { ...result, fromCache: false };
  }

  private withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`timeout de ${ms}ms (${label})`)), ms).unref(),
      ),
    ]);
  }
}
