import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {getLogger} from '../logger';
import {ActionInterface} from '../interfaces/ActionInterface';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import Census from '../config/census';
import {rest} from 'ps2census';
import {InstanceFacilityControlSchemaInterface} from '../models/instance/InstanceFacilityControlModel';
import ApplicationException from '../exceptions/ApplicationException';
import {censusOldFacilities} from '../constants/censusOldFacilities';
import {InstanceMetagameTerritorySchemaInterface} from '../models/instance/InstanceMetagameTerritory';
import {CensusEnvironment} from '../types/CensusEnvironment';
import {Bracket} from '../constants/bracket';
import {CensusApiRetryDriver} from '../drivers/CensusApiRetryDriver';

interface MapDataInterface {
    instance: string;
    facility: number;
    timestamp: Date;
    oldFaction: number;
    newFaction: number;
    durationHeld: 0;
    isDefence: 0;
    isInitial: boolean;
    outfitCaptured: null;
}

export default class MetagameInstanceTerritoryStartAction implements ActionInterface {
    private static readonly logger = getLogger('MetagameInstanceTerritoryStartAction');
    private readonly instance: MetagameTerritoryInstance;
    private readonly environment: CensusEnvironment;
    private readonly instanceMetagameFactory: MongooseModelFactory<InstanceMetagameTerritorySchemaInterface>;
    private readonly instanceFacilityControlModelFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>;
    private readonly censusConfig: Census;
    private readonly facilityControlAction: ActionInterface;

    constructor(
        instance: MetagameTerritoryInstance,
        environment: CensusEnvironment,
        instanceMetagameFactory: MongooseModelFactory<InstanceMetagameTerritorySchemaInterface>,
        instanceFacilityControlModelFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>,
        censusConfig: Census,
        facilityControlAction: ActionInterface,
    ) {
        this.instance = instance;
        this.environment = environment;
        this.instanceMetagameFactory = instanceMetagameFactory;
        this.instanceFacilityControlModelFactory = instanceFacilityControlModelFactory;
        this.censusConfig = censusConfig;
        this.facilityControlAction = facilityControlAction;
    }

    public async execute(): Promise<boolean> {
        MetagameInstanceTerritoryStartAction.logger.info(`[${this.instance.instanceId}] Running startActions()`);

        this.instance.bracket = Bracket.UNKNOWN;

        await this.instanceMetagameFactory.model.updateOne(
            {instanceId: this.instance.instanceId},
            {bracket: this.instance.bracket},
        ).catch((err: Error) => {
            throw new ApplicationException(`[${this.instance.instanceId}] Unable to update bracket! E: ${err.message}`, 'MetagameInstanceTerritoryFacilityControlAction');
        });

        MetagameInstanceTerritoryStartAction.logger.info(`[${this.instance.instanceId}] Trying to get initial map state`);

        const docs = await this.getInitialMap();

        if (!docs) {
            throw new ApplicationException(`[${this.instance.instanceId}] Map state was empty!`, 'MetagameInstanceTerritoryStartAction');
        }

        // Insert the map data into the instance facility control collection
        void this.instanceFacilityControlModelFactory.model.insertMany(docs)
            .catch((err: Error) => {
                if (!err.message.includes('E11000')) {
                    throw new ApplicationException(`[${this.instance.instanceId}] Error inserting initial map state! E: ${err.message}`, 'MetagameInstanceTerritoryStartAction');
                }
            });

        MetagameInstanceTerritoryStartAction.logger.info(`[${this.instance.instanceId}] Inserted initial map state`);

        // Also update the result of the instance now we have hydrated the territory info
        await this.facilityControlAction.execute();

        return true;
    }

    private async getInitialMap(): Promise<MapDataInterface[]> {
        // Take a snapshot of the map for use with territory calculations for the end
        const get = rest.getFactory(this.environment, this.censusConfig.serviceID);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const docs: MapDataInterface[] = [];

        const request = get(
            rest.join(
                rest.map,
                [{
                    type: 'map_region',
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    inject_at: 'map_region',
                    on: 'Regions.Row.RowData.RegionId',
                    to: 'map_region_id',
                }],
            ),
            { // Query for filter
                // eslint-disable-next-line @typescript-eslint/naming-convention
                world_id: String(this.instance.world),
                // eslint-disable-next-line @typescript-eslint/naming-convention
                zone_ids: String(this.instance.zone),
            },
        );

        const apiRequest = new CensusApiRetryDriver(request, 'MetagameInstanceTerritoryStartAction');
        await apiRequest.try().then((mapData) => {
            if (!mapData || mapData.length === 0) {
                throw new ApplicationException(`[${this.instance.instanceId}] No map data was returned from Census! Cannot start alert properly!`);
            }

            const date = new Date();

            mapData[0].Regions.Row.forEach((row) => {
                // Check if we have a facility type, if we don't chuck it as it's an old facility
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                const facilityId = parseInt(row.RowData.map_region.facility_id, 10);

                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (row.RowData.map_region.facility_type_id && facilityId && !censusOldFacilities.includes(facilityId)) {
                    docs.push({
                        instance: this.instance.instanceId,
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        facility: parseInt(row.RowData.map_region.facility_id, 10),
                        timestamp: date,
                        oldFaction: parseInt(row.RowData.FactionId, 10),
                        newFaction: parseInt(row.RowData.FactionId, 10),
                        durationHeld: 0,
                        isDefence: 0,
                        isInitial: true,
                        outfitCaptured: null,
                    });
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                    MetagameInstanceTerritoryStartAction.logger.warn(`[${this.instance.instanceId}] Unknown / invalid facility detected! ${row.RowData.map_region.facility_name}`);
                }
            });
        });

        return docs;
    }
}
