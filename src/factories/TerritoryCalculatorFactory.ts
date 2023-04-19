import {Injectable} from '@nestjs/common';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {Rest} from 'ps2census';
import Redis from 'ioredis';
import ZoneDataParser from '../parsers/ZoneDataParser';
import MetagameTerritoryCalculator from '../calculators/MetagameTerritoryCalculator';
import OutfitWarsTerritoryInstance from '../instances/OutfitWarsTerritoryInstance';
import OutfitwarsTerritoryCalculator from '../calculators/OutfitwarsTerritoryCalculator';
import MetricsHandler from '../handlers/MetricsHandler';
import {ConfigService} from '@nestjs/config';
import {PS2AlertsApiDriver} from '../drivers/PS2AlertsApiDriver';

@Injectable()
export default class TerritoryCalculatorFactory {
    constructor(
        private readonly ps2AlertsApiClient: PS2AlertsApiDriver,
        private readonly cacheClient: Redis,
        private readonly zoneDataParser: ZoneDataParser,
        private readonly metricsHandler: MetricsHandler,
        private readonly config: ConfigService,
    ) {}

    public buildMetagameTerritoryCalculator(
        instance: MetagameTerritoryInstance,
        restClient: Rest.Client,
    ): MetagameTerritoryCalculator {
        return new MetagameTerritoryCalculator(
            instance,
            restClient,
            this.ps2AlertsApiClient,
            this.cacheClient,
            this.zoneDataParser,
            this.metricsHandler,
            this.config,
        );
    }

    public buildOutfitwarsTerritoryCalculator(
        instance: OutfitWarsTerritoryInstance,
        restClient: Rest.Client,
    ): OutfitwarsTerritoryCalculator {
        return new OutfitwarsTerritoryCalculator(
            instance,
            restClient,
            this.ps2AlertsApiClient,
            this.cacheClient,
            this.zoneDataParser,
            this.metricsHandler,
            this.config,
        );
    }
}
