import {CalculatorInterface} from './CalculatorInterface';
import TerritoryCalculatorAbstract, {PercentagesInterface} from './TerritoryCalculatorAbstract';
import {MetagameTerritoryControlResultInterface} from '../ps2alerts-constants/interfaces/MetagameTerritoryControlResultInterface';
import {Faction} from '../ps2alerts-constants/faction';
import {FactionNumbersInterface} from '../ps2alerts-constants/interfaces/FactionNumbersInterface';
import {Ps2alertsEventState} from '../ps2alerts-constants/ps2alertsEventState';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {Rest} from 'ps2census';
import {AxiosInstance} from 'axios';
import Redis from 'ioredis';
import ZoneDataParser from '../parsers/ZoneDataParser';
import {getLogger} from '../logger';

export default class MetagameTerritoryCalculator extends TerritoryCalculatorAbstract implements CalculatorInterface<MetagameTerritoryControlResultInterface> {
    private static readonly classLogger = getLogger('MetagameTerritoryCalculator');

    constructor(
        protected readonly instance: MetagameTerritoryInstance,
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

    public async calculate(): Promise<MetagameTerritoryControlResultInterface> {
        MetagameTerritoryCalculator.classLogger.debug(`[${this.instance.instanceId}] Running TerritoryCalculator`);

        // Hydrate the territory data
        await this.populateLists();

        // Now calculate the result
        const warpgateCount = {
            vs: 0,
            nc: 0,
            tr: 0,
        };

        this.warpgateList.forEach((warpgate) => {
            if (warpgate.facilityFaction === Faction.VANU_SOVEREIGNTY) {
                warpgateCount.vs++;
            }

            if (warpgate.facilityFaction === Faction.NEW_CONGLOMERATE) {
                warpgateCount.nc++;
            }

            if (warpgate.facilityFaction === Faction.TERRAN_REPUBLIC) {
                warpgateCount.tr++;
            }
        });

        /* eslint-disable */
        // TS y u no track protective if statements for maps correctly reeeeeee
        const bases: FactionNumbersInterface = {
            vs: this.factionFacilitiesMap.has(Faction.VANU_SOVEREIGNTY)
                // @ts-ignore
                ? this.factionFacilitiesMap.get(Faction.VANU_SOVEREIGNTY).size - warpgateCount.vs
                : 0,
            nc: this.factionFacilitiesMap.has(Faction.NEW_CONGLOMERATE)
                // @ts-ignore
                ? this.factionFacilitiesMap.get(Faction.NEW_CONGLOMERATE).size - warpgateCount.nc
                : 0,
            tr: this.factionFacilitiesMap.has(Faction.TERRAN_REPUBLIC)
                // @ts-ignore
                ? this.factionFacilitiesMap.get(Faction.TERRAN_REPUBLIC).size - warpgateCount.tr
                : 0,
        };
        /* eslint-enable */

        if (MetagameTerritoryCalculator.classLogger.isSillyEnabled()) {
            console.log(`[${this.instance.instanceId}] outOfPlay bases`, this.disabledFacilityList.size, this.disabledFacilityList);
        }

        const baseCount = this.mapFacilityList.size - this.warpgateList.size;
        const outOfPlayCount = this.disabledFacilityList.size;

        const percentages = this.calculatePercentages(baseCount, bases, outOfPlayCount);
        const victor = this.calculateVictor(percentages);

        // Forcibly clean the data arrays so we don't have any chance of naughty memory leaks
        this.reset();

        return {
            vs: percentages.vs,
            nc: percentages.nc,
            tr: percentages.tr,
            cutoff: percentages.cutoff,
            outOfPlay: percentages.outOfPlay,
            victor: this.instance.state === Ps2alertsEventState.ENDED ? victor.victor : null,
            draw: this.instance.state === Ps2alertsEventState.ENDED ? victor.draw : false,
            perBasePercentage: percentages.perBasePercentage,
        };
    }

    // noinspection JSMethodCanBeStatic
    private calculateVictor(percentages: PercentagesInterface): {victor: Faction, draw: boolean} {
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
