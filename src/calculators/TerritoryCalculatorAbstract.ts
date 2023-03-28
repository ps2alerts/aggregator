/* eslint-disable @typescript-eslint/restrict-template-expressions,@typescript-eslint/no-unsafe-member-access */
import {Faction} from '../ps2alerts-constants/faction';
import ApplicationException from '../exceptions/ApplicationException';
import {jsonLogOutput} from '../utils/json';
import {censusOldFacilities} from '../ps2alerts-constants/censusOldFacilities';
import {FactionNumbersInterface} from '../ps2alerts-constants/interfaces/FactionNumbersInterface';
import CensusMapRegionQueryParser from '../parsers/CensusMapRegionQueryParser';
import {Rest} from 'ps2census';
import {ps2AlertsApiEndpoints} from '../ps2alerts-constants/ps2AlertsApiEndpoints';
import {AxiosInstance, AxiosResponse} from 'axios';
import PS2AlertsInstanceEntriesInstanceFacilityResponseInterface
    from '../interfaces/PS2AlertsInstanceEntriesInstanceFacilityResponseInterface';
import Redis from 'ioredis';
import ZoneDataParser from '../parsers/ZoneDataParser';
import InstanceAbstract from '../instances/InstanceAbstract';
import {FacilityType} from '../ps2alerts-constants/facilityType';
import {Ps2AlertsEventType} from '../ps2alerts-constants/ps2AlertsEventType';
import {Logger} from '@nestjs/common';
import StatisticsHandler from '../handlers/StatisticsHandler';
import config from '../config';

export interface PercentagesInterface extends FactionNumbersInterface {
    cutoff: number;
    outOfPlay: number;
    perBasePercentage: number;
}

export interface FacilityInterface {
    facilityId: number;
    facilityName: string;
    facilityType: number;
    facilityFaction: Faction;
}

export interface WarpgateCounts {
    vs: number;
    nc: number;
    tr: number;
}

export default abstract class TerritoryCalculatorAbstract {
    private static readonly logger = new Logger('TerritoryCalculator');

    protected readonly factionFacilitiesMap: Map<Faction, Set<number>> = new Map<Faction, Set<number>>();
    protected readonly mapFacilityList: Map<number, FacilityInterface> = new Map<number, FacilityInterface>();
    protected readonly cutoffFacilityList: Map<number, FacilityInterface> = new Map<number, FacilityInterface>();
    protected readonly disabledFacilityList: Map<number, FacilityInterface> = new Map<number, FacilityInterface>();
    protected readonly warpgateList: Set<FacilityInterface> = new Set<FacilityInterface>();
    protected warpgateCounts: WarpgateCounts = {vs: 0, nc: 0, tr: 0};
    protected baseCount = 0;
    protected outOfPlayCount = 0;
    protected factionNumbers: FactionNumbersInterface;

    protected constructor(
        protected readonly instance: InstanceAbstract,
        protected readonly restClient: Rest.Client,
        protected readonly ps2AlertsApiClient: AxiosInstance,
        protected readonly cacheClient: Redis,
        protected readonly zoneDataParser: ZoneDataParser,
        protected readonly statisticsHandler: StatisticsHandler,
    ) {}

    protected async hydrateData(): Promise<void> {
        // Get the map's facilities, allowing us to grab warpgates for starting the traversal and facility names for debug
        await this.getMapFacilities();

        // Push warpgates to a special list as they're not used in territory calculations
        this.mapFacilityList.forEach((facility) => {
            if (facility.facilityType === FacilityType.WARPGATE) {
                this.warpgateList.add(facility);
            }

            // Additionally, check the facility ownership so we can mark locked bases as out of play.
            if (this.instance.ps2AlertsEventType === Ps2AlertsEventType.LIVE_METAGAME &&
                (facility.facilityFaction === Faction.NONE || facility.facilityFaction === Faction.NS_OPERATIVES)) {
                this.disabledFacilityList.set(facility.facilityId, facility);

                // Now we know it's powered down, remove it from the cutoff list
                if (this.cutoffFacilityList.has(facility.facilityId)) {
                    this.cutoffFacilityList.delete(facility.facilityId);
                }
            }
        });

        const zoneLattices = this.zoneDataParser.getLattices(this.instance.zone);

        // For each warpgate returned, execute the lattice traversal
        for (const warpgate of this.warpgateList) {
            const faction = await this.getFacilityFaction(warpgate.facilityId);

            if (warpgate.facilityFaction === Faction.VANU_SOVEREIGNTY) {
                this.warpgateCounts.vs++;
            }

            if (warpgate.facilityFaction === Faction.NEW_CONGLOMERATE) {
                this.warpgateCounts.nc++;
            }

            if (warpgate.facilityFaction === Faction.TERRAN_REPUBLIC) {
                this.warpgateCounts.tr++;
            }

            TerritoryCalculatorAbstract.logger.verbose(`******** [${this.instance.instanceId}] STARTING FACTION ${faction} WARPGATE ********`);
            await this.traverse(
                warpgate.facilityId,
                0,
                faction,
                0,
                zoneLattices,
            );
            TerritoryCalculatorAbstract.logger.verbose(`******** [${this.instance.instanceId}] FINISHED FACTION ${faction} WARPGATE ********`);
        }

        // Now we've traversed the lattice etc lets make some metrics
        this.baseCount = this.mapFacilityList.size - this.warpgateList.size;
        this.outOfPlayCount = this.disabledFacilityList.size;

        // Now calculate the territory %ages to pass off to the client class for the result

        /* eslint-disable */
        // TS Y U NO UNDERSTAND PROTECTIVE IFS WITH MAPS?!
        this.factionNumbers = {
            vs: this.factionFacilitiesMap.has(Faction.VANU_SOVEREIGNTY)
                // @ts-ignore
                ? this.factionFacilitiesMap.get(Faction.VANU_SOVEREIGNTY).size - this.warpgateCounts.vs
                : 0,
            nc: this.factionFacilitiesMap.has(Faction.NEW_CONGLOMERATE)
                // @ts-ignore
                ? this.factionFacilitiesMap.get(Faction.NEW_CONGLOMERATE).size - this.warpgateCounts.nc
                : 0,
            tr: this.factionFacilitiesMap.has(Faction.TERRAN_REPUBLIC)
                // @ts-ignore
                ? this.factionFacilitiesMap.get(Faction.TERRAN_REPUBLIC).size - this.warpgateCounts.tr
                : 0,
        }
        /* eslint-enable */
    }

    protected calculatePercentages(): PercentagesInterface {
        const perBasePercentage = 100 / this.baseCount;
        const percentages = {
            vs: Math.floor(this.factionNumbers.vs * perBasePercentage),
            nc: Math.floor(this.factionNumbers.nc * perBasePercentage),
            tr: Math.floor(this.factionNumbers.tr * perBasePercentage),
            cutoff: this.calculateCutoffPercentage(this.factionNumbers, this.baseCount, perBasePercentage, this.outOfPlayCount),
            outOfPlay: Math.floor(this.outOfPlayCount * perBasePercentage),
            perBasePercentage,
        };

        TerritoryCalculatorAbstract.logger.log(`[${this.instance.instanceId}] updated score: VS: ${percentages.vs} | NC: ${percentages.nc} | TR: ${percentages.tr} | Cutoff: ${percentages.cutoff}`);

        return percentages;
    }

    protected calculateCutoffPercentage(
        bases: FactionNumbersInterface,
        baseCount: number,
        perBase: number,
        outOfPlayCount: number,
    ): number {
        const cutoffCount = (baseCount - bases.vs - bases.nc - bases.tr) - outOfPlayCount;
        const cutoffPercent = Math.floor(cutoffCount * perBase);

        if (config.logger.silly) {
            console.log('Cutoff bases', this.cutoffFacilityList);
        }

        return cutoffPercent;
    }

    protected async getMapFacilities(): Promise<void> {
        TerritoryCalculatorAbstract.logger.verbose(`[${this.instance.instanceId}] Commencing to get the map facilities...`);
        // Take a snapshot of the map for use with territory calculations for the end
        const mapData = await new CensusMapRegionQueryParser(
            this.restClient,
            'TerritoryCalculatorAbstract',
            this.instance,
            this.cacheClient,
            this.zoneDataParser,
            this.statisticsHandler,
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
                    TerritoryCalculatorAbstract.logger.error(`[${this.instance.instanceId}] Could not get facility faction! ${err.message} - replacing with values from Census`);
                }

                facilityFaction = parseInt(region.FactionId, 10);
                TerritoryCalculatorAbstract.logger.warn(`[${this.instance.instanceId}] Facility faction replaced! New value is ${facilityFaction}`);
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
    protected async traverse(
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
        if (!this.factionFacilitiesMap.has(ownerFaction)) {
            this.factionFacilitiesMap.set(ownerFaction, new Set<number>());
        }

        // If we have already parsed this base for this faction, ignore it
        if (this.factionFacilitiesMap.get(ownerFaction)?.has(facilityId)) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            TerritoryCalculatorAbstract.logger.verbose(`${formatDepth} [${this.instance.instanceId} / ${facilityId} - ${facilityName}] Facility has already been parsed, skipping!`);
            return true;
        }

        // Perform a check here to see if the faction of the base belongs to the previous base's faction, if it does not, stop!
        if (ownerFaction !== faction) {
            TerritoryCalculatorAbstract.logger.verbose(`${formatDepth} [${facilityId} - ${facilityName}] NO MATCH - ${faction} - ${ownerFaction}`);
            return true;
        }

        // Record the facility ID and faction ownership - this will eventually contain all linked bases for the particular faction.
        this.factionFacilitiesMap.get(ownerFaction)?.add(facilityId);
        this.cutoffFacilityList.delete(facilityId); // Remove the facility from the list of cutoffs as it is linked

        // First, get a list of links associated with the facility
        const connectedLinks = latticeLinks.get(facilityId.toString());
        const nextHops: number[] = [];

        if (connectedLinks) {
            // Then reduce this down to a singular list of the next hops based off if they've already been scanned or not
            connectedLinks.forEach((link) => {
                const linkFacilityId = parseInt(link, 10);

                if (!this.factionFacilitiesMap.get(ownerFaction)?.has(linkFacilityId)) {
                    nextHops.push(linkFacilityId);
                }
            });
        }

        TerritoryCalculatorAbstract.logger.verbose(`${formatDepth} [${callingFacilityId} > ${facilityId} - ${facilityName}] nextHops ${jsonLogOutput(nextHops)}`);

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
    protected async getFacilityFaction(facilityId: number): Promise<Faction> {
        TerritoryCalculatorAbstract.logger.verbose(`[${this.instance.instanceId}] Getting faction for facility ${facilityId}...`);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const endpoint = this.instance.ps2AlertsEventType === Ps2AlertsEventType.LIVE_METAGAME
            ? ps2AlertsApiEndpoints.instanceEntriesInstanceFacilityFacility
            : ps2AlertsApiEndpoints.outfitwarsInstanceFacilityFacility;
        const apiResponse: AxiosResponse = await this.ps2AlertsApiClient.get(
            endpoint
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

        TerritoryCalculatorAbstract.logger.verbose(`[${this.instance.instanceId}] Facility ${facilityId} faction is ${result.newFaction}`);

        return result.newFaction;
    }

    // Reset all the lists to ensure we have fresh data and to prevent memory leakage
    protected reset(): void {
        this.factionFacilitiesMap.clear();
        this.mapFacilityList.clear();
        this.cutoffFacilityList.clear();
        this.disabledFacilityList.clear();
        this.warpgateList.clear();
        this.warpgateCounts = {vs: 0, nc: 0, tr: 0};
        this.baseCount = 0;
        this.outOfPlayCount = 0;
    }
}
