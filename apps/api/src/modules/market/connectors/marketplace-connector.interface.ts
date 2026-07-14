import { Marketplace } from '@prisma/client';

export interface MarketSearchQuery {
  modelName: string;
  brandName: string;
  categorySlug: string;
  /** valor de referência estimado (msrp × depreciação) para gerar/validar preços */
  referencePrice: number;
  condition: string;
}

export interface RawListing {
  marketplace: Marketplace;
  title: string;
  price: number;
  url: string;
  sellerRating: number | null;
  sellerName: string;
  conditionLabel: string | null;
  quantity: number;
}

export interface MarketplaceConnector {
  readonly marketplace: Marketplace;
  search(query: MarketSearchQuery): Promise<RawListing[]>;
}

export const MARKETPLACE_CONNECTORS = 'MARKETPLACE_CONNECTORS';
