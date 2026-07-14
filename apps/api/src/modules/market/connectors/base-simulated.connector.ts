import { Marketplace } from '@prisma/client';
import { pick, randBetween, randInt, Rng, seededRng } from '../../../common/utils/random';
import {
  MarketplaceConnector,
  MarketSearchQuery,
  RawListing,
} from './marketplace-connector.interface';

const SELLERS = [
  'TechStore Oficial', 'usados_br_2020', 'Loja do João', 'MegaEletro', 'vendedor_confiavel',
  'Ana Vende Tudo', 'importados.sp', 'CellCenter', 'Casa dos Games', 'outlet_premium',
  'ricardo.usados', 'eletro_barato_mg', 'GamerShop RJ', 'ml_top_seller', 'apagando_tudo',
];

const GOOD_TITLE_TEMPLATES = [
  '{brand} {model} — excelente estado',
  '{brand} {model} usado, funcionando perfeitamente',
  '{model} original {brand} com nota fiscal',
  '{model} seminovo na caixa',
  '{brand} {model} impecável, único dono',
  '{model} usado poucas vezes, sem detalhes',
  'Vendo {brand} {model} conservado',
  '{model} completo com acessórios originais',
  '{brand} {model} bem cuidado, aceito proposta',
  '{model} em ótimo estado de conservação',
];

const BAD_TITLE_TEMPLATES: Array<{ template: string; kind: 'broken' | 'parts' | 'bundle' | 'replica' }> = [
  { template: '{model} com tela trincada, não liga', kind: 'broken' },
  { template: '{model} com defeito na bateria — leia a descrição', kind: 'broken' },
  { template: '{model} para retirada de peças', kind: 'parts' },
  { template: 'Sucata {brand} {model} para peças', kind: 'parts' },
  { template: 'Lote com 3 {model} para revenda', kind: 'bundle' },
  { template: 'Kit com 2 unidades {model} atacado', kind: 'bundle' },
  { template: '{model} réplica primeira linha AAA', kind: 'replica' },
  { template: 'Capa genérica compatível com {model}', kind: 'replica' },
];

/**
 * Conector simulado determinístico (seed por marketplace+modelo).
 * Gera anúncios realistas em pt-BR: a maioria válida em torno do preço
 * de referência, e alguns "ruins" de propósito (lotes, para peças,
 * réplicas, preços absurdos, duplicados) para exercitar os filtros.
 */
export abstract class BaseSimulatedConnector implements MarketplaceConnector {
  abstract readonly marketplace: Marketplace;
  /** viés de preço do marketplace (ex.: OLX mais barato que Amazon) */
  protected abstract readonly priceBias: number;
  protected abstract readonly urlHost: string;

  async search(query: MarketSearchQuery): Promise<RawListing[]> {
    const rng = seededRng(`${this.marketplace}:${query.brandName}:${query.modelName}`);
    const listings: RawListing[] = [];
    const count = randInt(rng, 8, 16);
    const base = query.referencePrice * this.priceBias;

    for (let i = 0; i < count; i++) {
      listings.push(this.goodListing(rng, query, base, i));
    }

    // 2–4 anúncios problemáticos
    const badCount = randInt(rng, 2, 4);
    for (let i = 0; i < badCount; i++) {
      listings.push(this.badListing(rng, query, base, count + i));
    }

    // 1 preço absurdo (golpe ou erro de digitação)
    listings.push({
      ...this.goodListing(rng, query, base, 900),
      price: rng() > 0.5 ? Math.round(base * randBetween(rng, 4, 8)) : Math.round(base * 0.08),
    });

    // 1 duplicado exato de um anúncio existente
    if (listings.length > 2) {
      const dup = listings[randInt(rng, 0, count - 1)];
      listings.push({ ...dup, url: `${dup.url}-repost` });
    }

    // ~15% de itens irrelevantes (acessórios de outro produto)
    if (rng() > 0.5) {
      listings.push({
        marketplace: this.marketplace,
        title: `Película de vidro + capinha ${query.brandName}`,
        price: Math.round(randBetween(rng, 15, 60)),
        url: this.url(rng, 950),
        sellerRating: Number(randBetween(rng, 3.5, 5).toFixed(1)),
        sellerName: pick(rng, SELLERS),
        conditionLabel: 'Novo',
        quantity: 1,
      });
    }

    return listings;
  }

  private goodListing(rng: Rng, q: MarketSearchQuery, base: number, i: number): RawListing {
    const template = pick(rng, GOOD_TITLE_TEMPLATES);
    // dispersão realista: ±18% em torno do preço de referência do marketplace
    const price = Math.round(base * randBetween(rng, 0.82, 1.18));
    return {
      marketplace: this.marketplace,
      title: template.replace('{brand}', q.brandName).replace('{model}', q.modelName),
      price,
      url: this.url(rng, i),
      sellerRating: Number(randBetween(rng, 3.6, 5).toFixed(1)),
      sellerName: pick(rng, SELLERS),
      conditionLabel: pick(rng, ['Usado', 'Usado - Como novo', 'Usado - Bom', 'Seminovo']),
      quantity: 1,
    };
  }

  private badListing(rng: Rng, q: MarketSearchQuery, base: number, i: number): RawListing {
    const bad = pick(rng, BAD_TITLE_TEMPLATES);
    const priceFactor =
      bad.kind === 'broken' || bad.kind === 'parts'
        ? randBetween(rng, 0.15, 0.4)
        : bad.kind === 'bundle'
          ? randBetween(rng, 1.8, 2.8)
          : randBetween(rng, 0.1, 0.35);
    return {
      marketplace: this.marketplace,
      title: bad.template.replace('{brand}', q.brandName).replace('{model}', q.modelName),
      price: Math.round(base * priceFactor),
      url: this.url(rng, i),
      sellerRating: Number(randBetween(rng, 2.5, 4.8).toFixed(1)),
      sellerName: pick(rng, SELLERS),
      conditionLabel: bad.kind === 'replica' ? 'Novo' : 'Usado',
      quantity: bad.kind === 'bundle' ? randInt(rng, 2, 4) : 1,
    };
  }

  private url(rng: Rng, i: number): string {
    return `https://${this.urlHost}/item-${Math.floor(rng() * 1e9)}-${i}`;
  }
}
