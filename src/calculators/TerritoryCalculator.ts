/* eslint-disable @typescript-eslint/restrict-template-expressions */
import {CalculatorInterface} from './CalculatorInterface';
import {Faction} from '../ps2alerts-constants/faction';
import {injectable} from 'inversify';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import ApplicationException from '../exceptions/ApplicationException';
import {getLogger} from '../logger';
import {jsonLogOutput} from '../utils/json';
import {censusOldFacilities} from '../ps2alerts-constants/censusOldFacilities';
import {Ps2alertsEventState} from '../ps2alerts-constants/ps2alertsEventState';
import {FactionNumbersInterface} from '../interfaces/FactionNumbersInterface';
import TerritoryResultInterface from '../interfaces/TerritoryResultInterface';
import CensusMapRegionQueryParser from '../parsers/CensusMapRegionQueryParser';
import {Rest} from 'ps2census';
import {ps2AlertsApiEndpoints} from '../ps2alerts-constants/ps2AlertsApiEndpoints';
import {AxiosInstance, AxiosResponse} from 'axios';
import PS2AlertsInstanceEntriesInstanceFacilityResponseInterface
    from '../interfaces/PS2AlertsInstanceEntriesInstanceFacilityResponseInterface';
import Redis from 'ioredis';
import ZoneDataParser from '../parsers/ZoneDataParser';

interface PercentagesInterface extends FactionNumbersInterface {
    cutoff: number;
    outOfPlay: number;
    perBasePercentage: number;
}

interface FacilityInterface {
    facilityId: number;
    facilityName: string;
    facilityType: number;
    facilityFaction: Faction;
}

@injectable()
export default class TerritoryCalculator implements CalculatorInterface<TerritoryResultInterface> {
    private static readonly logger = getLogger('TerritoryCalculator');
    private readonly factionParsedFacilitiesMap: Map<Faction, Set<number>> = new Map<Faction, Set<number>>();
    private readonly mapFacilityList: Map<number, FacilityInterface> = new Map<number, FacilityInterface>();
    private readonly cutoffFacilityList: Map<number, FacilityInterface> = new Map<number, FacilityInterface>();
    private readonly disabledFacilityList: Map<number, FacilityInterface> = new Map<number, FacilityInterface>();

    constructor(
        private readonly instance: MetagameTerritoryInstance,
        private readonly restClient: Rest.Client,
        private readonly ps2AlertsApiClient: AxiosInstance,
        private readonly cacheClient: Redis,
        private readonly zoneDataParser: ZoneDataParser,
    ) {}

    public async calculate(): Promise<TerritoryResultInterface> {
        TerritoryCalculator.logger.debug(`[${this.instance.instanceId}] Running TerritoryCalculator`);
        const warpgates: Map<Faction, FacilityInterface[]> = new Map<Faction, FacilityInterface[]>();

        // Get the map's facilities, allowing us to grab warpgates for starting the traversal and facility names for debug
        await this.getMapFacilities();

        // Filter out Warpgates from the list as that's a constant plus the game doesn't calculate them in the territory %s.
        // Additionally, check their ownership so we can mark locked bases as out of play.
        this.mapFacilityList.forEach((facility) => {
            if (facility.facilityType === 7) {
                if (!warpgates.has(facility.facilityFaction)) {
                    warpgates.set(facility.facilityFaction, [facility]);
                } else {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    warpgates.get(facility.facilityFaction).push(facility);
                }
            }

            if (facility.facilityFaction === Faction.NONE || facility.facilityFaction === Faction.NS_OPERATIVES) {
                this.disabledFacilityList.set(facility.facilityId, facility);

                // Now we know it's powered down, remove it from the cutoff list
                if (this.cutoffFacilityList.has(facility.facilityId)) {
                    this.cutoffFacilityList.delete(facility.facilityId);
                }
            }
        });

        const zoneLattices = this.zoneDataParser.getLattices(this.instance.zone);

        // For each warpgate returned, execute the lattice traversal
        for (const facility of warpgates) {
            for (const warpgate of facility[1]) {
                const faction = await this.getFacilityFaction(warpgate.facilityId);

                TerritoryCalculator.logger.silly(`******** [${this.instance.instanceId}] STARTING FACTION ${faction} WARPGATE ********`);
                await this.traverse(
                    warpgate.facilityId,
                    0,
                    faction,
                    0,
                    zoneLattices,
                );
                TerritoryCalculator.logger.silly(`******** [${this.instance.instanceId}] FINISHED FACTION ${faction} WARPGATE ********`);
            }
        }

        // Collate the statistics here
        /* eslint-disable */
        // @ts-ignore
        const vsWarpgates = warpgates.has(Faction.VANU_SOVEREIGNTY) ? warpgates.get(Faction.VANU_SOVEREIGNTY).length : 0;
        // @ts-ignore
        const ncWarpgates = warpgates.has(Faction.NEW_CONGLOMERATE) ? warpgates.get(Faction.NEW_CONGLOMERATE).length : 0;
        // @ts-ignore
        const trWarpgates = warpgates.has(Faction.TERRAN_REPUBLIC) ? warpgates.get(Faction.TERRAN_REPUBLIC).length : 0;
        const totalWarpgates = vsWarpgates + ncWarpgates + trWarpgates; // Means if we ever get a 1v1 cont, we're good

        const bases: FactionNumbersInterface = {
            vs: this.factionParsedFacilitiesMap.has(Faction.VANU_SOVEREIGNTY)
                // @ts-ignore Bollocks
                ? this.factionParsedFacilitiesMap.get(Faction.VANU_SOVEREIGNTY).size - vsWarpgates
                : 0,
            nc: this.factionParsedFacilitiesMap.has(Faction.NEW_CONGLOMERATE)
                // @ts-ignore Bollocks
                ? this.factionParsedFacilitiesMap.get(Faction.NEW_CONGLOMERATE).size - ncWarpgates
                : 0,
            tr: this.factionParsedFacilitiesMap.has(Faction.TERRAN_REPUBLIC)
                // @ts-ignore Bollocks
                ? this.factionParsedFacilitiesMap.get(Faction.TERRAN_REPUBLIC).size - trWarpgates
                : 0,
        };
        /* eslint-enable */

        const baseCount = this.mapFacilityList.size - totalWarpgates;
        const outOfPlayCount = this.disabledFacilityList.size;

        if (TerritoryCalculator.logger.isSillyEnabled()) {
            console.log(`[${this.instance.instanceId}] outOfPlay bases`, this.disabledFacilityList.size, this.disabledFacilityList);
        }

        const percentages = this.calculatePercentages(baseCount, bases, outOfPlayCount);
        const victor = this.calculateVictor(percentages);

        // Forcibly clean the data arrays so we don't have any chance of naughty memory leaks
        this.factionParsedFacilitiesMap.clear();
        this.mapFacilityList.clear();
        this.cutoffFacilityList.clear();
        this.disabledFacilityList.clear();

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

    private calculatePercentages(baseCount: number, bases: FactionNumbersInterface, outOfPlayCount: number): PercentagesInterface {
        const perBasePercentage = 100 / baseCount;
        const percentages = {
            vs: Math.floor(bases.vs * perBasePercentage),
            nc: Math.floor(bases.nc * perBasePercentage),
            tr: Math.floor(bases.tr * perBasePercentage),
            cutoff: this.calculateCutoffPercentage(bases, baseCount, perBasePercentage, outOfPlayCount),
            outOfPlay: Math.floor(outOfPlayCount * perBasePercentage),
            perBasePercentage,
        };

        TerritoryCalculator.logger.info(`[${this.instance.instanceId}] updated score: VS: ${percentages.vs} | NC: ${percentages.nc} | TR: ${percentages.tr} | Cutoff: ${percentages.cutoff}`);

        return percentages;
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

    private calculateCutoffPercentage(
        bases: FactionNumbersInterface,
        baseCount: number,
        perBase: number,
        outOfPlayCount: number,
    ): number {
        const cutoffCount = (baseCount - bases.vs - bases.nc - bases.tr) - outOfPlayCount;
        const cutoffPercent = Math.floor(cutoffCount * perBase);

        if (TerritoryCalculator.logger.isSillyEnabled()) {
            console.log('Cutoff bases', this.cutoffFacilityList);
        }

        return cutoffPercent;
    }

    private async getMapFacilities(): Promise<void> {
        TerritoryCalculator.logger.silly(`[${this.instance.instanceId}] Commencing to get the map facilities...`);
        // Take a snapshot of the map for use with territory calculations for the end
        const mapData = await new CensusMapRegionQueryParser(
            this.restClient,
            'MetagameInstanceTerritoryStartAction',
            this.instance,
            this.cacheClient,
            this.zoneDataParser,
        ).getMapData();

        if (mapData.length === 0) {
            throw new ApplicationException(`[${this.instance.instanceId}] Unable to properly get map data from census!`);
        }

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
                    TerritoryCalculator.logger.error(`[${this.instance.instanceId}] Could not get facility faction! ${err.message} - replacing with values from Census`);
                }

                facilityFaction = parseInt(region.FactionId, 10);
                TerritoryCalculator.logger.warn(`[${this.instance.instanceId}] Facility faction replaced! New value is ${facilityFaction}`);
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

    // Oh boi, it's graph time! https://github.com/ps2alerts/aggregator/issues/125#issuecomment-689070901
    // This function traverses the lattice links for each base, starting at the warpgate. It traverses each link until no other
    // bases can be found that are owned by the same faction. It then adds each facility to a map, which we collate later to get the raw number of bases.
    private async traverse(
        facilityId: number,
        callingFacilityId: number,
        faction: Faction,
        depth: number,
        latticeLinks: Map<string, Set<string>>, // Map<facilityId, Set<facilityId>>
    ): Promise<boolean> {
        if (!this.mapFacilityList.has(facilityId)) {
            throw new ApplicationException(`[${this.instance.instanceId}] Facility ID ${facilityId} does not exist in the facility list!`);
        }

        const facilityName = this.mapFacilityList.get(facilityId)?.facilityName ?? 'UNKNOWN';

        depth++;
        const formatDepth = '|'.repeat(depth);

        // Get the owner of the facility so we know which faction this is
        const ownerFaction = this.mapFacilityList.get(facilityId)?.facilityFaction ?? Faction.NONE;

        // Check if the faction facility set is initialized, if not do so and add the value (sets don't allow duplicates so the one below will be ignored)
        if (!this.factionParsedFacilitiesMap.has(ownerFaction)) {
            this.factionParsedFacilitiesMap.set(ownerFaction, new Set<number>());
        }

        // If we have already parsed this base for this faction, ignore it
        if (this.factionParsedFacilitiesMap.get(ownerFaction)?.has(facilityId)) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            TerritoryCalculator.logger.silly(`${formatDepth} [${this.instance.instanceId} / ${facilityId} - ${facilityName}] Facility has already been parsed, skipping!`);
            return true;
        }

        // Perform a check here to see if the faction of the base belongs to the previous base's faction, if it does not, stop!
        if (ownerFaction !== faction) {
            TerritoryCalculator.logger.silly(`${formatDepth} [${facilityId} - ${facilityName}] NO MATCH - ${faction} - ${ownerFaction}`);
            return true;
        }

        // Record the facility ID and faction ownership - this will eventually contain all linked bases for the particular faction.
        this.factionParsedFacilitiesMap.get(ownerFaction)?.add(facilityId);
        this.cutoffFacilityList.delete(facilityId); // Remove the facility from the list of cutoffs as it is linked

        // First, get a list of links associated with the facility
        const connectedLinks = latticeLinks.get(facilityId.toString());
        const nextHops: number[] = [];

        if (connectedLinks) {
            // Then reduce this down to a singular list of the next hops based off if they've already been scanned or not
            connectedLinks.forEach((link) => {
                const linkFacilityId = parseInt(link, 10);

                if (!this.factionParsedFacilitiesMap.get(ownerFaction)?.has(linkFacilityId)) {
                    nextHops.push(linkFacilityId);
                }
            });
        }

        TerritoryCalculator.logger.silly(`${formatDepth} [${callingFacilityId} > ${facilityId} - ${facilityName}] nextHops ${jsonLogOutput(nextHops)}`);

        // RE RE RECURSION
        // Promise of a promise of a promise until we're happy!
        for (const link of nextHops) {
            await this.traverse(
                link,
                facilityId,
                faction,
                depth,
                latticeLinks,
            );
        }

        return true;
    }

    // Gets the current status of the facility from the API
    private async getFacilityFaction(facilityId: number): Promise<Faction> {
        TerritoryCalculator.logger.silly(`[${this.instance.instanceId}] Getting faction for facility ${facilityId}...`);

        const apiResponse: AxiosResponse = await this.ps2AlertsApiClient.get(
            ps2AlertsApiEndpoints.instanceEntriesInstanceFacilityFacility
                .replace('{instanceId}', this.instance.instanceId)
                .replace('{facilityId}', facilityId.toString()),
        );

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const result: PS2AlertsInstanceEntriesInstanceFacilityResponseInterface = apiResponse.data;

        // This should always have a result, whether it be from the initial map capture (which will be the case for the warpgate)
        // or from a capture during the course of monitoring the instance.
        if (!result) {
            throw new ApplicationException(`[${this.instance.instanceId}] Facility ${facilityId} is missing capture information!`);
        }

        TerritoryCalculator.logger.silly(`[${this.instance.instanceId}] Facility ${facilityId} faction is ${result.newFaction}`);

        return result.newFaction;
    }
}
