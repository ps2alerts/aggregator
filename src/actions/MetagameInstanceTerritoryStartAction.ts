import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {getLogger} from '../logger';
import {ActionInterface} from '../interfaces/ActionInterface';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import Census from '../config/census';
import {rest} from 'ps2census';
import {InstanceFacilityControlSchemaInterface} from '../models/instance/InstanceFacilityControlModel';
import ApplicationException from '../exceptions/ApplicationException';
import {censusOldFacilities} from '../constants/censusOldFacilities';

export default class MetagameInstanceTerritoryStartAction implements ActionInterface {
    private static readonly logger = getLogger('MetagameInstanceTerritoryStartAction');
    private readonly instance: MetagameTerritoryInstance;
    private readonly instanceFacilityControlModelFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>;
    private readonly censusConfig: Census;

    constructor(
        instance: MetagameTerritoryInstance,
        instanceFacilityControlModelFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>,
        censusConfig: Census,
    ) {
        this.instance = instance;
        this.instanceFacilityControlModelFactory = instanceFacilityControlModelFactory;
        this.censusConfig = censusConfig;
    }

    public async execute(): Promise<boolean> {
        MetagameInstanceTerritoryStartAction.logger.info(`Running startActions() for instance "${this.instance.world}-${this.instance.censusInstanceId}"`);
        // Take a snapshot of the map for use with territory calculations for the end

        const get = rest.getFactory('ps2', this.censusConfig.serviceID);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const docs: any[] = [];

        await get(
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
        ).then((mapData) => {
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
                    MetagameInstanceTerritoryStartAction.logger.warn(`Unknown / invalid facility detected! ${row.RowData.map_region.facility_name}`);
                }
            });

            // Insert the map data into the instance facility control collection
            void this.instanceFacilityControlModelFactory.model.insertMany(docs)
                .catch((err: Error) => {
                    if (!err.message.includes('E11000')) {
                        throw new ApplicationException(`Error inserting Initial Map Capture! ${err.message}`, 'MetagameInstanceTerritoryStartAction');
                    }
                });

            MetagameInstanceTerritoryStartAction.logger.info(`Inserted initial map state for instance ${this.instance.instanceId}`);
        });

        return true;
    }
}
