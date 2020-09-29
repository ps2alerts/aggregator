import {VictoryConditionInterface} from './VictoryConditionInterface';
import {Faction} from '../constants/faction';
import {injectable} from 'inversify';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import {InstanceFacilityControlSchemaInterface} from '../models/instance/InstanceFacilityControlModel';
import {rest} from 'ps2census';
import Census from '../config/census';
import PS2AlertsMetagameInstance from '../instances/PS2AlertsMetagameInstance';
import ApplicationException from '../exceptions/ApplicationException';
import {getLogger} from '../logger';
import {jsonLogOutput} from '../utils/json';

export interface TerritoryVictoryConditionResultInterface {
    vs: number;
    nc: number;
    tr: number;
    winner: Faction;
    draw: boolean;
}

interface FacilityInterface {
    facilityId: number;
    facilityName: string;
    facilityType: number;
}

interface FacilityLatticeLinkInterface {
    facilityA: number;
    facilityB: number;
}

@injectable()
export default class TerritoryVictoryCondition implements VictoryConditionInterface {
    private static readonly logger = getLogger('TerritoryVictoryCondition');
    private readonly instanceFacilityControlFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>;
    private readonly censusConfig: Census;
    private readonly instance: PS2AlertsMetagameInstance;
    private readonly factionParsedFacilitiesMap: Map<Faction, Set<number>> = new Map<Faction, Set<number>>();
    private readonly mapFacilityList: Map<number, FacilityInterface> = new Map<number, FacilityInterface>();

    constructor(
        instance: PS2AlertsMetagameInstance,
        instanceFacilityControlModelFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>,
        censusConfig: Census,

    ) {
        this.instance = instance;
        this.instanceFacilityControlFactory = instanceFacilityControlModelFactory;
        this.censusConfig = censusConfig;
    }

    public async calculate(): Promise<TerritoryVictoryConditionResultInterface> {
        let winner = 0;
        let draw = false;

        // Get the map's facilities, allowing us to grab warpgates for starting the traversal and facility names for debug
        await this.getMapFacilities();
        const warpgates: number[] = [];
        this.mapFacilityList.forEach((facility) => {
            if (facility.facilityType === 7) {
                warpgates.push(facility.facilityId);
            }
        });

        // Get the lattice links for the zone
        const latticeLinks = await this.getLatticeLinks();

        // For each warpgate returned, execute the lattice traversal
        for (const facilityId of warpgates) {
            const faction = await this.getFacilityFaction(facilityId);

            TerritoryVictoryCondition.logger.debug(`======= [${this.instance.instanceId}] STARTING FACTION WARPGATE ${faction} =======`);
            await this.traverse(
                facilityId,
                faction,
                0,
                latticeLinks,
            );
            TerritoryVictoryCondition.logger.debug(`======= [${this.instance.instanceId}] FACTION WARPGATE ${faction} FINISHED =======`);
        }

        // Collate the statistics here
        /* eslint-disable */
        const bases = {
            // @ts-ignore
            vs: this.factionParsedFacilitiesMap.get(Faction.VANU_SOVEREIGNTY).size - 1,
            // @ts-ignore
            nc: this.factionParsedFacilitiesMap.get(Faction.NEW_CONGLOMERATE).size - 1,
            // @ts-ignore
            tr: this.factionParsedFacilitiesMap.get(Faction.TERRAN_REPUBLIC).size - 1,
        };
        /* eslint-enable */

        // Get total base count (to figure out percentages)
        const baseCount = this.mapFacilityList.size - warpgates.length; // Initial map includes warpgates, so we just take them off here (also safe if less than 3 WGs)
        const perBasePercent = 100 / baseCount;

        const vsPer = Math.floor(bases.vs * perBasePercent);
        const ncPer = Math.floor(bases.nc * perBasePercent);
        const trPer = Math.floor(bases.tr * perBasePercent);

        // Format scores into sortable object (where we store the score and the faction ID for easier picking out)
        const scores = [
            {faction: Faction.VANU_SOVEREIGNTY, score: vsPer},
            {faction: Faction.NEW_CONGLOMERATE, score: ncPer},
            {faction: Faction.TERRAN_REPUBLIC, score: trPer},
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
            draw = true; // 3-ways are possible, but not recorded in any special way
        } else {
            winner = scores[0].faction;
        }

        TerritoryVictoryCondition.logger.debug(scores);
        TerritoryVictoryCondition.logger.debug(`Cutoff: ${baseCount - bases.vs - bases.nc - bases.tr}`);
        TerritoryVictoryCondition.logger.debug(`Winner: ${winner}`);

        return {
            vs: vsPer,
            nc: ncPer,
            tr: trPer,
            winner,
            draw,
        };
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
        ).then((result) => {
            if (result.length === 0) {
                throw new ApplicationException(`Unable to get Facility map for I: ${this.instance.instanceId} - Z: ${this.instance.zone}`, 'TerritoryVictoryCondition');
            }

            result.forEach((region: rest.collectionTypes.mapRegion) => {
                const id = parseInt(region.facility_id, 10);
                const facility: FacilityInterface = {
                    facilityId: id,
                    facilityName: region.facility_name,
                    facilityType: parseInt(region.facility_type_id, 10),
                };
                this.mapFacilityList.set(id, facility);
            });
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
        const faction = await this.getFacilityFaction(facilityId);

        // Check if the faction facility set is initialized, if not do so and add the value (sets don't allow duplicates so the one below will be ignored)
        if (!this.factionParsedFacilitiesMap.has(faction)) {
            this.factionParsedFacilitiesMap.set(faction, new Set<number>());
        }

        // If we have already parsed this base for this faction, ignore it
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore bruh
        if (this.factionParsedFacilitiesMap.get(faction).has(facilityId)) {
            TerritoryVictoryCondition.logger.debug(`${formatDepth} [${this.instance.instanceId} / ${facilityId} - ${facilityName}] Facility has already been parsed, skipping!`);
            return true;
        }

        // Perform a check here to see if the faction of the base belongs to the previous base's faction, if it does not, stop!
        if (faction !== linkingFaction) {
            TerritoryVictoryCondition.logger.debug(`${formatDepth} [${facilityId} - ${facilityName}] NO MATCH - ${linkingFaction} - ${faction}`);
            return true;
        }

        // Record the facility ID and faction ownership - this will eventually contain all linked bases for the particular faction.
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore bruh
        this.factionParsedFacilitiesMap.get(faction).add(facilityId);

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

        TerritoryVictoryCondition.logger.debug(`${formatDepth} [${facilityId} - ${facilityName}] nextHops ${jsonLogOutput(nextHops)}`);

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
        TerritoryVictoryCondition.logger.debug(`[${this.instance.instanceId}] Getting faction for facility ${facilityId}...`);

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
                throw new ApplicationException('Empty result set!');
            }

            TerritoryVictoryCondition.logger.debug(`[${this.instance.instanceId}] Facility ${facilityId} faction is ${result.newFaction}`);

            return result.newFaction;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to retrieve ownership of facility ${facilityId} for I: ${this.instance.instanceId}! Error: ${err.message}`, 'TerritoryVictoryCondition');
        }
    }
}
