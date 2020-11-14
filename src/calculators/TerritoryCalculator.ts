import {CalculatorInterface} from './CalculatorInterface';
import {Faction} from '../constants/faction';
import {injectable} from 'inversify';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import {InstanceFacilityControlSchemaInterface} from '../models/instance/InstanceFacilityControlModel';
import {rest} from 'ps2census';
import Census from '../config/census';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import ApplicationException from '../exceptions/ApplicationException';
import {getLogger} from '../logger';
import {jsonLogOutput} from '../utils/json';
import {censusOldFacilities} from '../constants/censusOldFacilities';
import {InstanceResultInterface} from '../interfaces/InstanceResultInterface';
import {Ps2alertsEventState} from '../constants/ps2alertsEventState';
import {FactionNumbersInterface} from '../interfaces/FactionNumbersInterface';

export interface TerritoryResultInterface extends InstanceResultInterface {
    cutoff: number;
    outOfPlay: number;
    draw: boolean;
}

interface PercentagesInterface extends FactionNumbersInterface {
    cutoff: number;
    outOfPlay: number;
    perBase: number;
}

interface FacilityInterface {
    facilityId: number;
    facilityName: string;
    facilityType: number;
    facilityFaction: Faction;
}

interface FacilityLatticeLinkInterface {
    facilityA: number;
    facilityB: number;
}

@injectable()
export default class TerritoryCalculator implements CalculatorInterface {
    private static readonly logger = getLogger('TerritoryCalculator');
    private readonly instanceFacilityControlFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>;
    private readonly censusConfig: Census;
    private readonly instance: MetagameTerritoryInstance;
    private readonly factionParsedFacilitiesMap: Map<Faction, Set<number>> = new Map<Faction, Set<number>>();
    private readonly mapFacilityList: Map<number, FacilityInterface> = new Map<number, FacilityInterface>();
    private readonly cutoffFacilityList: Map<number, FacilityInterface> = new Map<number, FacilityInterface>();
    private readonly disabledFacilityList: Map<number, FacilityInterface> = new Map<number, FacilityInterface>();

    constructor(
        instance: MetagameTerritoryInstance,
        instanceFacilityControlModelFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>,
        censusConfig: Census,
    ) {
        this.instance = instance;
        this.instanceFacilityControlFactory = instanceFacilityControlModelFactory;
        this.censusConfig = censusConfig;
    }

    public async calculate(): Promise<TerritoryResultInterface> {
        const warpgates: number[] = [];

        // Get the lattice links for the zone
        const latticeLinks = await this.getLatticeLinks();

        // Get the map's facilities, allowing us to grab warpgates for starting the traversal and facility names for debug
        await this.getMapFacilities();

        // Filter out Warpgates from the list as that's a constant plus the game doesn't calculate them in the territory %s.
        this.mapFacilityList.forEach((facility) => {
            if (facility.facilityType === 7) {
                warpgates.push(facility.facilityId);
            }
        });

        // For each warpgate returned, execute the lattice traversal
        for (const facilityId of warpgates) {
            const faction = await this.getFacilityFaction(facilityId);

            TerritoryCalculator.logger.debug(`******** [${this.instance.instanceId}] STARTING FACTION WARPGATE ${faction} ********`);
            await this.traverse(
                facilityId,
                faction,
                0,
                latticeLinks,
            );
            TerritoryCalculator.logger.debug(`******** [${this.instance.instanceId}] FACTION WARPGATE ${faction} FINISHED  ********`);
        }

        // Collate the statistics here
        /* eslint-disable */
        const bases: FactionNumbersInterface = {
            vs: this.factionParsedFacilitiesMap.has(Faction.VANU_SOVEREIGNTY)
                // @ts-ignore Bollocks
                ? this.factionParsedFacilitiesMap.get(Faction.VANU_SOVEREIGNTY).size - 1 // -1 for Warpgate,
                : 0,
            nc: this.factionParsedFacilitiesMap.has(Faction.NEW_CONGLOMERATE)
                // @ts-ignore Bollocks
                ? this.factionParsedFacilitiesMap.get(Faction.NEW_CONGLOMERATE).size - 1
                : 0,
            tr: this.factionParsedFacilitiesMap.has(Faction.TERRAN_REPUBLIC)
                // @ts-ignore Bollocks
                ? this.factionParsedFacilitiesMap.get(Faction.TERRAN_REPUBLIC).size - 1
                : 0,
        };
        /* eslint-enable */

        const baseCount = this.mapFacilityList.size - warpgates.length; // Initial map includes warpgates, so we just take them off here (also safe if less than 3 WGs)
        const outOfPlayCount = this.calculateOutOfPlayBases();
        const percentages = this.calculatePercentages(baseCount, bases, outOfPlayCount);
        const winner = this.calculateWinner(percentages);

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
            winner: this.instance.state === Ps2alertsEventState.ENDED ? winner.winner : null,
            draw: this.instance.state === Ps2alertsEventState.ENDED ? winner.draw : false,
        };
    }

    private calculatePercentages(baseCount: number, bases: FactionNumbersInterface, outOfPlayCount: number): PercentagesInterface {
        const perBasePercent = 100 / baseCount;
        const percentages = {
            vs: Math.floor(bases.vs * perBasePercent),
            nc: Math.floor(bases.nc * perBasePercent),
            tr: Math.floor(bases.tr * perBasePercent),
            cutoff: this.calculateCutoffPercentage(bases, baseCount, perBasePercent, outOfPlayCount),
            outOfPlay: Math.floor(outOfPlayCount * perBasePercent),
            perBase: perBasePercent,
        };

        if (TerritoryCalculator.logger.isDebugEnabled()) {
            // eslint-disable-next-line no-console
            console.log('Percentages', percentages);
        }

        return percentages;
    }

    private calculateWinner(percentages: PercentagesInterface): {winner: Faction, draw: boolean} {
        const scores = [
            {faction: Faction.VANU_SOVEREIGNTY, score: percentages.vs},
            {faction: Faction.NEW_CONGLOMERATE, score: percentages.nc},
            {faction: Faction.TERRAN_REPUBLIC, score: percentages.tr},
        ];

        // Calculate winner via sorting the scores
        scores.sort((a, b) => {
            if (a.score < b.score) {
                return 1;
            }

            if (a.score > b.score) {
                return -1;
            }

            return 0;
        });

        // Determine winner via the score
        if (scores[0].score === scores[1].score) {
            return {winner: Faction.NONE, draw: true};
        } else {
            return {winner: scores[0].faction, draw: false};
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

        TerritoryCalculator.logger.debug(`Cutoff: ${cutoffCount} (${cutoffCount * perBase}%)`);

        if (TerritoryCalculator.logger.isDebugEnabled()) {
            // eslint-disable-next-line no-console
            console.log('Cutoff bases', this.cutoffFacilityList);
        }

        return cutoffPercent;
    }

    private calculateOutOfPlayBases(): number {
        this.mapFacilityList.forEach((facility) => {
            if (facility.facilityFaction === Faction.NONE || facility.facilityFaction === Faction.NS_OPERATIVES) {
                this.disabledFacilityList.set(facility.facilityId, facility);

                // Now we know it's powered down, remove it from the cutoff list
                if (this.cutoffFacilityList.has(facility.facilityId)) {
                    this.cutoffFacilityList.delete(facility.facilityId);
                }
            }
        });

        if (TerritoryCalculator.logger.isDebugEnabled()) {
            // eslint-disable-next-line no-console
            console.log('outOfPlay bases', this.disabledFacilityList.size);
        }

        return this.disabledFacilityList.size;
    }

    private async getMapFacilities(): Promise<void> {
        const get = rest.getFactory('ps2', this.censusConfig.serviceID);
        await get(
            rest.limit(
                rest.mapRegion,
                1000,
            ),
            {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                zone_id: String(this.instance.zone),
            },
        ).then(async (result) => {
            if (result.length === 0) {
                throw new ApplicationException(`Unable to get Facility map for I: ${this.instance.instanceId} - Z: ${this.instance.zone}`, 'TerritoryVictoryCondition');
            }

            for (const region of result) {
                const id = parseInt(region.facility_id, 10);

                // If facility is in blacklist, don't map it
                if (censusOldFacilities.includes(id) || isNaN(id)) {
                    continue;
                }

                const facility: FacilityInterface = {
                    facilityId: id,
                    facilityName: region.facility_name,
                    facilityType: parseInt(region.facility_type_id, 10),
                    facilityFaction: await this.getFacilityFaction(id),
                };
                this.mapFacilityList.set(id, facility);
                this.cutoffFacilityList.set(id, facility);
            }
        });
    }

    private async getLatticeLinks(): Promise<FacilityLatticeLinkInterface[]> {
        const facilityLatticeLinks: FacilityLatticeLinkInterface[] = [];
        const get = rest.getFactory('ps2', this.censusConfig.serviceID);

        await get(
            rest.limit(
                rest.facilityLink,
                1000,
            ),
            {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                zone_id: String(this.instance.zone),
            },
        ).then((result) => {
            result.forEach((link: rest.collectionTypes.facilityLink) => {
                facilityLatticeLinks.push({
                    facilityA: parseInt(link.facility_id_a, 10),
                    facilityB: parseInt(link.facility_id_b, 10),
                });
            });
        });

        if (facilityLatticeLinks.length === 0) {
            throw new ApplicationException(`[${this.instance.instanceId}] No facility links detected for Z: ${this.instance.zone}!`, 'TerritoryVictoryCalculation');
        }

        return facilityLatticeLinks;
    }

    // Oh boi, it's graph time! https://github.com/ps2alerts/aggregator/issues/125#issuecomment-689070901
    // This function traverses the lattice links for each base, starting at the warpgate. It traverses each link until no other
    // bases can be found that are owned by the same faction. It then adds each facility to a map, which we collate later to get the raw number of bases.
    private async traverse(facilityId: number, linkingFaction: Faction, depth: number, latticeLinks: FacilityLatticeLinkInterface[]): Promise<boolean> {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore bruhhh
        const facilityName = this.mapFacilityList.get(facilityId).facilityName;

        depth++;
        const formatDepth = '|'.repeat(depth);

        // Get the owner of the facility so we know which faction this is
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore this is already defined
        const faction = this.mapFacilityList.get(facilityId).facilityFaction;

        // Check if the faction facility set is initialized, if not do so and add the value (sets don't allow duplicates so the one below will be ignored)
        if (!this.factionParsedFacilitiesMap.has(faction)) {
            this.factionParsedFacilitiesMap.set(faction, new Set<number>());
        }

        // If we have already parsed this base for this faction, ignore it
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore bruh
        if (this.factionParsedFacilitiesMap.get(faction).has(facilityId)) {
            TerritoryCalculator.logger.debug(`${formatDepth} [${this.instance.instanceId} / ${facilityId} - ${facilityName}] Facility has already been parsed, skipping!`);
            return true;
        }

        // Perform a check here to see if the faction of the base belongs to the previous base's faction, if it does not, stop!
        if (faction !== linkingFaction) {
            TerritoryCalculator.logger.debug(`${formatDepth} [${facilityId} - ${facilityName}] NO MATCH - ${linkingFaction} - ${faction}`);
            return true;
        }

        // Record the facility ID and faction ownership - this will eventually contain all linked bases for the particular faction.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore bruh
        this.factionParsedFacilitiesMap.get(faction).add(facilityId);
        this.cutoffFacilityList.delete(facilityId); // Remove the facility from the list of cutoffs as it is linked

        // First, get a list of links associated with the facility
        const connectedLinks = latticeLinks.filter((latticeLink: FacilityLatticeLinkInterface) => {
            return latticeLink.facilityA === facilityId || latticeLink.facilityB === facilityId;
        });

        const nextHops: number[] = [];

        // Then reduce this down to a singular list of the next hops
        connectedLinks.forEach((link) => {
            if (facilityId === link.facilityA) {
                nextHops.push(link.facilityB);
            } else {
                nextHops.push(link.facilityA);
            }
        });

        TerritoryCalculator.logger.debug(`${formatDepth} [${facilityId} - ${facilityName}] nextHops ${jsonLogOutput(nextHops)}`);

        // RE RE RECURSION
        // Promise of a promise of a promise until we're happy!
        for (const link of nextHops) {
            await this.traverse(
                link,
                faction,
                depth,
                latticeLinks,
            );
        }

        return true;
    }

    // Gets the current status of the facility from the database
    private async getFacilityFaction(facilityId: number): Promise<Faction> {
        TerritoryCalculator.logger.debug(`[${this.instance.instanceId}] Getting faction for facility ${facilityId}...`);

        try {
            const result: InstanceFacilityControlSchemaInterface | null = await this.instanceFacilityControlFactory.model.findOne({
                instance: this.instance.instanceId,
                facility: facilityId,
            })
                .sort({timestamp: -1})
                .exec();

            // This should always have a result, whether it be from the initial map capture (which will be the case for the warpgate)
            // or from a capture during the course of monitoring the instance.
            if (!result) {
                TerritoryCalculator.logger.error(`[${this.instance.instanceId}] Facility ${facilityId} is missing capture information!`);
                return Faction.NONE;
            }

            TerritoryCalculator.logger.debug(`[${this.instance.instanceId}] Facility ${facilityId} faction is ${result.newFaction}`);

            return result.newFaction;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to retrieve ownership of facility ${facilityId} for I: ${this.instance.instanceId}! Error: ${err.message}`, 'TerritoryVictoryCondition');
        }
    }
}
