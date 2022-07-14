import {inject, injectable} from 'inversify';
import {TYPES} from '../constants/types';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import TerritoryCalculator from '../calculators/TerritoryCalculator';
import {Rest} from 'ps2census';
import {AxiosInstance} from 'axios';
import {Redis} from 'ioredis';
import ZoneDataParser from '../parsers/ZoneDataParser';

@injectable()
export default class TerritoryCalculatorFactory {
    constructor(
        @inject(TYPES.ps2AlertsApiClient) private readonly ps2AlertsApiClient: AxiosInstance,
        @inject(TYPES.redis) private readonly cacheClient: Redis,
        private readonly zoneDataParser: ZoneDataParser,
    ) {}

    public build(
        instance: MetagameTerritoryInstance,
        restClient: Rest.Client,
    ): TerritoryCalculator {
        return new TerritoryCalculator(
            instance,
            restClient,
            this.ps2AlertsApiClient,
            this.cacheClient,
            this.zoneDataParser,
        );
    }
}
