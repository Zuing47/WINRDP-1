import { Marketplace } from '@prisma/client';
import { RawListing } from '../connectors/marketplace-connector.interface';
import { ListingFilterChain } from './listing-filter-chain';

const baseQuery = {
  modelName: 'iPhone 15 Pro',
  brandName: 'Apple',
  categorySlug: 'celular',
  referencePrice: 6000,
  condition: 'GOOD',
};

function listing(overrides: Partial<RawListing>): RawListing {
  return {
    marketplace: Marketplace.MERCADO_LIVRE,
    title: 'Apple iPhone 15 Pro usado, excelente estado',
    price: 6000,
    url: 'https://produto.mercadolivre.com.br/item-1',
    sellerRating: 4.8,
    sellerName: 'Loja Exemplo',
    conditionLabel: 'Usado',
    quantity: 1,
    ...overrides,
  };
}

describe('ListingFilterChain', () => {
  const chain = new ListingFilterChain();

  it('mantém anúncios válidos sem motivo de exclusão', () => {
    const [result] = chain.apply([listing({})], baseQuery);
    expect(result.excludedReason).toBeNull();
  });

  it('exclui itens quebrados/com defeito', () => {
    const [result] = chain.apply(
      [listing({ title: 'iPhone 15 Pro com tela trincada, não liga' })],
      baseQuery,
    );
    expect(result.excludedReason).toContain('danificado');
  });

  it('exclui itens para peças/sucata', () => {
    const [result] = chain.apply(
      [listing({ title: 'iPhone 15 Pro para retirada de peças' })],
      baseQuery,
    );
    expect(result.excludedReason).toContain('peças');
  });

  it('exclui lotes/kits (por título ou quantidade)', () => {
    const byTitle = chain.apply([listing({ title: 'Lote com 3 iPhone 15 Pro' })], baseQuery)[0];
    const byQuantity = chain.apply([listing({ quantity: 3 })], baseQuery)[0];
    expect(byTitle.excludedReason).toContain('Lote/kit');
    expect(byQuantity.excludedReason).toContain('Lote/kit');
  });

  it('exclui réplicas/genéricos', () => {
    const [result] = chain.apply(
      [listing({ title: 'iPhone 15 Pro réplica primeira linha' })],
      baseQuery,
    );
    expect(result.excludedReason).toContain('Réplica');
  });

  it('exclui itens irrelevantes ao modelo buscado', () => {
    const [result] = chain.apply(
      [listing({ title: 'Capinha de silicone para celular genérico' })],
      baseQuery,
    );
    expect(result.excludedReason).not.toBeNull();
  });

  it('exclui duplicados (mesmo título, preço e vendedor)', () => {
    const l = listing({});
    const results = chain.apply([l, { ...l }], baseQuery);
    expect(results[0].excludedReason).toBeNull();
    expect(results[1].excludedReason).toContain('duplicado');
  });

  it('exclui outliers de preço (muito abaixo ou acima da mediana)', () => {
    const valid = Array.from({ length: 10 }, (_, i) =>
      listing({ price: 5800 + i * 20, url: `https://produto.mercadolivre.com.br/item-${i}` }),
    );
    const tooCheap = listing({ price: 500, url: 'https://produto.mercadolivre.com.br/item-cheap' });
    const tooExpensive = listing({ price: 40000, url: 'https://produto.mercadolivre.com.br/item-expensive' });

    const results = chain.apply([...valid, tooCheap, tooExpensive], baseQuery);
    const cheapResult = results.find((r) => r.url.includes('item-cheap'))!;
    const expensiveResult = results.find((r) => r.url.includes('item-expensive'))!;

    expect(cheapResult.excludedReason).toContain('realidade');
    expect(cheapResult.isOutlier).toBe(true);
    expect(expensiveResult.excludedReason).toContain('realidade');
  });
});
