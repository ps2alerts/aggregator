import {CalculatorInterface} from './CalculatorInterface';
import TerritoryCalculatorAbstract, {FacilityInterface, PercentagesInterface} from './TerritoryCalculatorAbstract';
import {OutfitwarsTerritoryResultInterface} from '../ps2alerts-constants/interfaces/OutfitwarsTerritoryResultInterface';
import OutfitWarsTerritoryInstance from '../instances/OutfitWarsTerritoryInstance';
import {AxiosInstance} from 'axios';
import Redis from 'ioredis';
import {Rest} from 'ps2census';
import ZoneDataParser from '../parsers/ZoneDataParser';
import {getLogger} from '../logger';
import {Ps2alertsEventState} from '../ps2alerts-constants/ps2alertsEventState';
import {Team} from '../ps2alerts-constants/outfitwars/team';
import {NexusInitialMapData} from '../ps2alerts-constants/outfitwars/nexus';
import {censusOldFacilities} from '../ps2alerts-constants/censusOldFacilities';
import {Faction} from '../ps2alerts-constants/faction';

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

    protected async getMapFacilities(): Promise<void> {
        const mapData = NexusInitialMapData;

        for (const row of mapData[0].Regions.Row) {
            const region = row.RowData;
            const id = parseInt(region.map_region.facility_id, 10);

            // If facility is in blacklist, don't map it
            if (censusOldFacilities.includes(id) || isNaN(id)) {
                continue;
            }

            let facilityFaction = Faction.NONE;

            // Attempt to get facility faction - if we're unable we'll attempt to get it from Census instead
            try {
                facilityFaction = await this.getFacilityFaction(id);
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                if (err instanceof Error) {
                    OutfitwarsTerritoryCalculator.classLogger.error(`[${this.instance.instanceId}] Could not get facility faction! ${err.message} - replacing with values from Census`);
                }

                facilityFaction = parseInt(region.FactionId, 10);
                OutfitwarsTerritoryCalculator.classLogger.warn(`[${this.instance.instanceId}] Facility faction replaced! New value is ${facilityFaction}`);
            }

            const facility: FacilityInterface = {
                facilityId: id,
                facilityName: region.map_region.facility_name ?? 'UNKNOWN!',
                facilityType: parseInt(region.map_region.facility_type_id, 10) ?? 1,
                facilityFaction,
            };

            this.mapFacilityList.set(id, facility);
            this.cutoffFacilityList.set(id, facility);
        }
    }
}
