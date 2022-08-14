import {CalculatorInterface} from './CalculatorInterface';
import TerritoryCalculatorAbstract, {PercentagesInterface} from './TerritoryCalculatorAbstract';
import {OutfitwarsTerritoryResultInterface} from '../ps2alerts-constants/interfaces/OutfitwarsTerritoryResultInterface';
import OutfitWarsTerritoryInstance from '../instances/OutfitWarsTerritoryInstance';
import {AxiosInstance} from 'axios';
import Redis from 'ioredis';
import {Rest} from 'ps2census';
import ZoneDataParser from '../parsers/ZoneDataParser';
import {getLogger} from '../logger';
import {Ps2alertsEventState} from '../ps2alerts-constants/ps2alertsEventState';
import {Team} from '../ps2alerts-constants/outfitwars/team';

export default class OutfitwarsTerritoryCalculator extends TerritoryCalculatorAbstract implements CalculatorInterface<OutfitwarsTerritoryResultInterface> {
    private static readonly classLogger = getLogger('OutfitwarsTerritoryCalculator');

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
        OutfitwarsTerritoryCalculator.classLogger.debug(`[${this.instance.instanceId}] Running TerritoryCalculator`);

        // Hydrate the territory data
        await this.hydrateData();

        // Now calculate the result

        const percentages = this.calculatePercentages();

        // Forcibly clean the data arrays so we don't have any chance of naughty memory leaks
        this.reset();

        return {
            blue: percentages.nc,
            red: percentages.tr,
            cutoff: percentages.cutoff,
            outOfPlay: percentages.outOfPlay,
            victor: this.instance.state === Ps2alertsEventState.ENDED
                ? this.calculateVictor(percentages)
                : null,
            perBasePercentage: percentages.perBasePercentage,
        };
    }

    // noinspection JSMethodCanBeStatic
    private calculateVictor(percentages: PercentagesInterface): Team {
        const scores = [
            {faction: Team.BLUE, score: percentages.nc},
            {faction: Team.RED, score: percentages.tr},
        ];

        // Calculate victor via sorting the scores
        scores.sort((a, b) => {
            if (a.score < b.score) {
                return 1;
            }

            if (a.score > b.score) {
                return -1;
            }

            return 0;
        });

        // Determine victor via the score. Draws are not possible in OW.
        return scores[0].faction;
    }
}
