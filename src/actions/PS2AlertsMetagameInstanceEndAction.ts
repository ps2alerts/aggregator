import PS2AlertsMetagameInstance from '../instances/PS2AlertsMetagameInstance';
import {getLogger} from '../logger';
import {ActionInterface} from '../interfaces/ActionInterface';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import {InstanceMetagameSchemaInterface} from '../models/instance/InstanceMetagame';
import Census from '../config/census';

export default class PS2AlertsMetagameInstanceEndAction implements ActionInterface {
    private static readonly logger = getLogger('PS2AlertsMetagameInstanceEndAction');
    private readonly instance: PS2AlertsMetagameInstance;
    private readonly instanceMetagameFactory: MongooseModelFactory<InstanceMetagameSchemaInterface>;
    private readonly censusConfig: Census;

    constructor(
        instance: PS2AlertsMetagameInstance,
        instanceMetagameFactory: MongooseModelFactory<InstanceMetagameSchemaInterface>,
        censusConfig: Census,
    ) {
        this.instance = instance;
        this.instanceMetagameFactory = instanceMetagameFactory;
        this.censusConfig = censusConfig;
    }

    public async execute(): Promise<boolean> {
        PS2AlertsMetagameInstanceEndAction.logger.info(`Running endActions() for instance #${this.instance.world}-${this.instance.censusInstanceId}`);

        // Calculate Victory Condition!

        return true;
    }
}
