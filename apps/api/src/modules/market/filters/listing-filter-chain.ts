import { MarketSearchQuery, RawListing } from '../connectors/marketplace-connector.interface';

export interface FilteredListing extends RawListing {
  excludedReason: string | null;
  isOutlier: boolean;
}

export interface ListingFilter {
  readonly name: string;
  /** Retorna o motivo de exclusão (pt-BR) ou null se o anúncio passa. */
  check(listing: FilteredListing, ctx: FilterContext): string | null;
}

export interface FilterContext {
  query: MarketSearchQuery;
  all: FilteredListing[];
}

const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// ─── 1. BrokenItemFilter ─────────────────────────────────────────
export class BrokenItemFilter implements ListingFilter {
  readonly name = 'BrokenItemFilter';
  private readonly terms = ['quebrado', 'quebrada', 'trincado', 'trincada', 'nao liga', 'defeito', 'defeituoso', 'tela trincada'];

  check(listing: FilteredListing): string | null {
    const title = normalize(listing.title);
    const hit = this.terms.find((t) => title.includes(t));
    return hit ? `Item danificado: título menciona "${hit}"` : null;
  }
}

// ─── 2. ForPartsFilter ───────────────────────────────────────────
export class ForPartsFilter implements ListingFilter {
  readonly name = 'ForPartsFilter';
  private readonly terms = ['para pecas', 'retirada de pecas', 'sucata', 'retirar pecas'];

  check(listing: FilteredListing): string | null {
    const title = normalize(listing.title);
    const hit = this.terms.find((t) => title.includes(t));
    return hit ? `Anúncio para peças: título menciona "${hit}"` : null;
  }
}

// ─── 3. BundleFilter ─────────────────────────────────────────────
export class BundleFilter implements ListingFilter {
  readonly name = 'BundleFilter';
  private readonly terms = ['lote', 'kit com', 'atacado', 'combo com'];

  check(listing: FilteredListing): string | null {
    if (listing.quantity > 1) return `Lote/kit: anúncio com ${listing.quantity} unidades`;
    const title = normalize(listing.title);
    const hit = this.terms.find((t) => title.includes(t));
    return hit ? `Lote/kit: título menciona "${hit}"` : null;
  }
}

// ─── 4. ReplicaFilter ────────────────────────────────────────────
export class ReplicaFilter implements ListingFilter {
  readonly name = 'ReplicaFilter';
  private readonly terms = ['replica', 'primeira linha', 'similar', 'generico', 'generica', 'compativel com', 'paralelo'];

  check(listing: FilteredListing): string | null {
    const title = normalize(listing.title);
    const hit = this.terms.find((t) => title.includes(t));
    return hit ? `Réplica/genérico: título menciona "${hit}"` : null;
  }
}

// ─── 5. PriceSanityFilter ────────────────────────────────────────
export class PriceSanityFilter implements ListingFilter {
  readonly name = 'PriceSanityFilter';

  check(listing: FilteredListing, ctx: FilterContext): string | null {
    const valid = ctx.all.filter((l) => l.excludedReason === null);
    if (valid.length < 4) return null;
    const prices = valid.map((l) => l.price).sort((a, b) => a - b);
    const median = prices[Math.floor(prices.length / 2)];
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const std = Math.sqrt(prices.reduce((a, p) => a + (p - avg) ** 2, 0) / prices.length);

    if (listing.price < median * 0.2) {
      return `Preço fora da realidade: R$ ${listing.price.toFixed(0)} < 20% da mediana (R$ ${median.toFixed(0)})`;
    }
    if (listing.price > median * 3) {
      return `Preço fora da realidade: R$ ${listing.price.toFixed(0)} > 300% da mediana (R$ ${median.toFixed(0)})`;
    }
    if (std > 0 && Math.abs(listing.price - avg) > 2.5 * std) {
      return `Outlier estatístico: preço a mais de 2,5σ da média (R$ ${avg.toFixed(0)} ± ${(2.5 * std).toFixed(0)})`;
    }
    return null;
  }
}

// ─── 6. DuplicateFilter ──────────────────────────────────────────
export class DuplicateFilter implements ListingFilter {
  readonly name = 'DuplicateFilter';
  private seen = new Set<string>();

  reset(): void {
    this.seen = new Set();
  }

  check(listing: FilteredListing): string | null {
    const fingerprint = `${normalize(listing.title)}|${listing.price}|${normalize(listing.sellerName)}`;
    if (this.seen.has(fingerprint)) {
      return 'Anúncio duplicado (mesmo título, preço e vendedor)';
    }
    this.seen.add(fingerprint);
    return null;
  }
}

// ─── 7. RelevanceFilter ──────────────────────────────────────────
export class RelevanceFilter implements ListingFilter {
  readonly name = 'RelevanceFilter';

  check(listing: FilteredListing, ctx: FilterContext): string | null {
    const modelTokens = normalize(`${ctx.query.brandName} ${ctx.query.modelName}`)
      .split(' ')
      .filter((t) => t.length > 1);
    const title = normalize(listing.title);
    const matched = modelTokens.filter((t) => title.includes(t)).length;
    const similarity = modelTokens.length ? matched / modelTokens.length : 1;
    if (similarity < 0.5) {
      return `Baixa relevância: título não corresponde ao modelo buscado (similaridade ${(similarity * 100).toFixed(0)}%)`;
    }
    return null;
  }
}

/**
 * Cadeia de filtros do §5 — cada exclusão registra excluded_reason.
 * Ordem: texto primeiro (barato), estatística por último (precisa do
 * conjunto já limpo de lixo textual).
 */
export class ListingFilterChain {
  private readonly duplicateFilter = new DuplicateFilter();
  private readonly textFilters: ListingFilter[] = [
    new BrokenItemFilter(),
    new ForPartsFilter(),
    new BundleFilter(),
    new ReplicaFilter(),
    new RelevanceFilter(),
    this.duplicateFilter,
  ];
  private readonly priceSanity = new PriceSanityFilter();

  apply(listings: RawListing[], query: MarketSearchQuery): FilteredListing[] {
    this.duplicateFilter.reset();
    const result: FilteredListing[] = listings.map((l) => ({
      ...l,
      excludedReason: null,
      isOutlier: false,
    }));
    const ctx: FilterContext = { query, all: result };

    for (const listing of result) {
      for (const filter of this.textFilters) {
        const reason = filter.check(listing, ctx);
        if (reason) {
          listing.excludedReason = reason;
          break;
        }
      }
    }

    // sanity de preço sobre os sobreviventes
    for (const listing of result) {
      if (listing.excludedReason) continue;
      const reason = this.priceSanity.check(listing, ctx);
      if (reason) {
        listing.excludedReason = reason;
        listing.isOutlier = true;
      }
    }

    return result;
  }
}
