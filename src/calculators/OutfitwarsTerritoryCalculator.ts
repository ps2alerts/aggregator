import {CalculatorInterface} from './CalculatorInterface';
import TerritoryCalculatorAbstract from './TerritoryCalculatorAbstract';
import {OutfitwarsTerritoryResultInterface} from '../ps2alerts-constants/interfaces/OutfitwarsTerritoryResultInterface';
import OutfitWarsTerritoryInstance from '../instances/OutfitWarsTerritoryInstance';
import {Rest} from 'ps2census';
import {AxiosInstance} from 'axios';
import Redis from 'ioredis';
import ZoneDataParser from '../parsers/ZoneDataParser';
import {Team} from '../ps2alerts-constants/outfitwars/team';

export default class OutfitwarsTerritoryCalculator extends TerritoryCalculatorAbstract implements CalculatorInterface<OutfitwarsTerritoryResultInterface> {

    constructor(
        protected readonly instance: OutfitWarsTerritoryInstance,
        restClient: Rest.Client,
        ps2AlertsApiClient: AxiosInstance,
        cacheClient: Redis,
        zoneDataParser: ZoneDataParser,
    ) {
        super(
            instance,
            restClient,
            ps2AlertsApiClient,
            cacheClient,
            zoneDataParser,
        );
    }

    public async calculate(): Promise<OutfitwarsTerritoryResultInterface> {
        return {
            victor: Team.BLUE,
            team1: 50,
            team2: 50,
            cutoff: 0,
            outOfPlay: 0,
            perBasePercentage: 11,
        };
        // TODO: To implement
    }
}
