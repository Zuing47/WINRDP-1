import { Injectable } from '@nestjs/common';
import { Marketplace } from '@prisma/client';
import { BaseSimulatedConnector } from './base-simulated.connector';

@Injectable()
export class MercadoLivreConnector extends BaseSimulatedConnector {
  readonly marketplace = Marketplace.MERCADO_LIVRE;
  protected readonly priceBias = 1.0;
  protected readonly urlHost = 'produto.mercadolivre.com.br';
}

@Injectable()
export class OlxConnector extends BaseSimulatedConnector {
  readonly marketplace = Marketplace.OLX;
  protected readonly priceBias = 0.92;
  protected readonly urlHost = 'olx.com.br';
}

@Injectable()
export class FacebookMarketplaceConnector extends BaseSimulatedConnector {
  readonly marketplace = Marketplace.FACEBOOK_MARKETPLACE;
  protected readonly priceBias = 0.88;
  protected readonly urlHost = 'facebook.com/marketplace';
}

@Injectable()
export class EbayConnector extends BaseSimulatedConnector {
  readonly marketplace = Marketplace.EBAY;
  protected readonly priceBias = 1.08;
  protected readonly urlHost = 'ebay.com';
}

@Injectable()
export class AmazonConnector extends BaseSimulatedConnector {
  readonly marketplace = Marketplace.AMAZON;
  protected readonly priceBias = 1.12;
  protected readonly urlHost = 'amazon.com.br';
}

@Injectable()
export class MagazineLuizaConnector extends BaseSimulatedConnector {
  readonly marketplace = Marketplace.MAGAZINE_LUIZA;
  protected readonly priceBias = 1.05;
  protected readonly urlHost = 'magazineluiza.com.br';
}

export const ALL_CONNECTORS = [
  MercadoLivreConnector,
  OlxConnector,
  FacebookMarketplaceConnector,
  EbayConnector,
  AmazonConnector,
  MagazineLuizaConnector,
];
