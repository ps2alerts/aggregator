import {inject, injectable} from 'inversify';
import {TYPES} from '../constants/types';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import TerritoryCalculator from '../calculators/TerritoryCalculator';
import {RestClient} from 'ps2census/dist/rest';
import {AxiosInstance} from 'axios';
import {Redis} from 'ioredis';

@injectable()
export default class TerritoryCalculatorFactory {
    constructor(
        @inject(TYPES.ps2AlertsApiClient) private readonly ps2AlertsApiClient: AxiosInstance,
        @inject(TYPES.redis) private readonly cacheClient: Redis,
    ) {}

    public build(
        instance: MetagameTerritoryInstance,
        restClient: RestClient,
    ): TerritoryCalculator {
        return new TerritoryCalculator(
            instance,
            restClient,
            this.ps2AlertsApiClient,
            this.cacheClient,
        );
    }
}
