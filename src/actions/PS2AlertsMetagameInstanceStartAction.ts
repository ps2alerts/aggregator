import PS2AlertsMetagameInstance from '../instances/PS2AlertsMetagameInstance';
import {getLogger} from '../logger';
import {ActionInterface} from '../interfaces/ActionInterface';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import Census from '../config/census';
import {rest} from 'ps2census';
import {InstanceFacilityControlSchemaInterface} from '../models/instance/InstanceFacilityControlModel';

export default class PS2AlertsMetagameInstanceStartAction implements ActionInterface {
    private static readonly logger = getLogger('PS2AlertsMetagameInstanceStartAction');
    private readonly instance: PS2AlertsMetagameInstance;
    private readonly instanceFacilityControlModelFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>;
    private readonly censusConfig: Census;

    constructor(
        instance: PS2AlertsMetagameInstance,
        instanceFacilityControlModelFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>,
        censusConfig: Census,
    ) {
        this.instance = instance;
        this.instanceFacilityControlModelFactory = instanceFacilityControlModelFactory;
        this.censusConfig = censusConfig;
    }

    public async execute(): Promise<boolean> {
        PS2AlertsMetagameInstanceStartAction.logger.info(`Running startActions() for instance "${this.instance.world}-${this.instance.censusInstanceId}"`);
        // Take a snapshot of the map for use with territory calculations for the end

        const get = rest.getFactory('ps2', this.censusConfig.serviceID);
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
        ).then((mapData: any) => {
            const date = new Date();

            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            mapData[0].Regions.Row.forEach((row: any) => {
                // Ignore Warpgates
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (row.RowData.map_region.facility_type_id === '7') {
                    return;
                }

                docs.push({
                    instance: this.instance.instanceId,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    facility: parseInt(row.RowData.map_region.facility_id, 10),
                    timestamp: date,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    oldFaction: parseInt(row.RowData.FactionId, 10),
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    newFaction: parseInt(row.RowData.FactionId, 10),
                    durationHeld: 0,
                    isDefence: 0,
                    isInitial: true,
                    outfitCaptured: null,
                });
            });

            // Insert the map data into the instance facility control collection
            void this.instanceFacilityControlModelFactory.model.insertMany(docs)
                .catch((err: Error) => {
                    if (!err.message.includes('E11000')) {
                        PS2AlertsMetagameInstanceStartAction.logger.error(`Error inserting Initial Map Capture! ${err.message}`);
                    }
                });

            PS2AlertsMetagameInstanceStartAction.logger.info(`Inserted initial map state for instance ${this.instance.instanceId}`);
        });

        return true;
    }
}
