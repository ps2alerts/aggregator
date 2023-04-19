import {Inject, Injectable} from '@nestjs/common';
import {TYPES} from '../constants/types';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {Rest} from 'ps2census';
import {AxiosInstance} from 'axios';
import Redis from 'ioredis';
import ZoneDataParser from '../parsers/ZoneDataParser';
import MetagameTerritoryCalculator from '../calculators/MetagameTerritoryCalculator';
import OutfitWarsTerritoryInstance from '../instances/OutfitWarsTerritoryInstance';
import OutfitwarsTerritoryCalculator from '../calculators/OutfitwarsTerritoryCalculator';
import MetricsHandler from '../handlers/MetricsHandler';
import {ConfigService} from '@nestjs/config';

@Injectable()
export default class TerritoryCalculatorFactory {
    constructor(
        @Inject(TYPES.ps2AlertsApiClient) private readonly ps2AlertsApiClient: AxiosInstance,
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
