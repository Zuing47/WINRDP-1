import { Module } from '@nestjs/common';
import {
  ALL_CONNECTORS,
  AmazonConnector,
  EbayConnector,
  FacebookMarketplaceConnector,
  MagazineLuizaConnector,
  MercadoLivreConnector,
  OlxConnector,
} from './connectors/connectors';
import { MARKETPLACE_CONNECTORS } from './connectors/marketplace-connector.interface';
import { MarketSearchService } from './market-search.service';

@Module({
  providers: [
    ...ALL_CONNECTORS,
    {
      provide: MARKETPLACE_CONNECTORS,
      useFactory: (...connectors) => connectors,
      inject: [
        MercadoLivreConnector,
        OlxConnector,
        FacebookMarketplaceConnector,
        EbayConnector,
        AmazonConnector,
        MagazineLuizaConnector,
      ],
    },
    MarketSearchService,
  ],
  exports: [MarketSearchService],
})
export class MarketModule {}
