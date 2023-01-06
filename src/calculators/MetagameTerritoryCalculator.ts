/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {CalculatorInterface} from './CalculatorInterface';
import TerritoryCalculatorAbstract from './TerritoryCalculatorAbstract';
import {MetagameTerritoryControlResultInterface} from '../ps2alerts-constants/interfaces/MetagameTerritoryControlResultInterface';
import {Faction} from '../ps2alerts-constants/faction';
import {FactionNumbersInterface} from '../ps2alerts-constants/interfaces/FactionNumbersInterface';
import {Ps2AlertsEventState} from '../ps2alerts-constants/ps2AlertsEventState';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {Rest} from 'ps2census';
import {AxiosInstance} from 'axios';
import Redis from 'ioredis';
import ZoneDataParser from '../parsers/ZoneDataParser';
import {getLogger} from '../logger';
import StatisticsHandler from '../handlers/StatisticsHandler';

export default class MetagameTerritoryCalculator extends TerritoryCalculatorAbstract implements CalculatorInterface<MetagameTerritoryControlResultInterface> {
    private static readonly classLogger = getLogger('MetagameTerritoryCalculator');

    constructor(
        protected readonly instance: MetagameTerritoryInstance,
        restClient: Rest.Client,
        ps2AlertsApiClient: AxiosInstance,
        cacheClient: Redis,
        zoneDataParser: ZoneDataParser,
        statisticsHandler: StatisticsHandler,
    ) {
        super(
            instance,
            restClient,
            ps2AlertsApiClient,
            cacheClient,
            zoneDataParser,
            statisticsHandler,
        );
    }

    public async calculate(): Promise<MetagameTerritoryControlResultInterface> {
        MetagameTerritoryCalculator.classLogger.debug(`[${this.instance.instanceId}] Running TerritoryCalculator`);

        // Hydrate the territory data
        await this.hydrateData();

        // Now calculate the results
        if (MetagameTerritoryCalculator.classLogger.isSillyEnabled()) {
            console.log(`[${this.instance.instanceId}] outOfPlay bases`, this.disabledFacilityList.size, this.disabledFacilityList);
        }

        const percentages = this.calculatePercentages();
        const victor = this.calculateVictor(percentages);

        // Forcibly clean the data arrays so we don't have any chance of naughty memory leaks
        this.reset();

        return {
            vs: percentages.vs,
            nc: percentages.nc,
            tr: percentages.tr,
            cutoff: percentages.cutoff,
            outOfPlay: percentages.outOfPlay,
            victor: this.instance.state === Ps2AlertsEventState.ENDED ? victor.victor : null,
            draw: this.instance.state === Ps2AlertsEventState.ENDED ? victor.draw : false,
            perBasePercentage: percentages.perBasePercentage,
        };
    }

    // noinspection JSMethodCanBeStatic
    private calculateVictor(percentages: FactionNumbersInterface): {victor: Faction, draw: boolean} {
        const scores = [
            {faction: Faction.VANU_SOVEREIGNTY, score: percentages.vs},
            {faction: Faction.NEW_CONGLOMERATE, score: percentages.nc},
            {faction: Faction.TERRAN_REPUBLIC, score: percentages.tr},
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

        // Determine victor via the score
        if (scores[0].score === scores[1].score) {
            return {victor: Faction.NONE, draw: true};
        } else {
            return {victor: scores[0].faction, draw: false};
        }
    }
}
