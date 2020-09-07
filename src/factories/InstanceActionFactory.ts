import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import {ActionInterface} from '../interfaces/ActionInterface';
import ApplicationException from '../exceptions/ApplicationException';
import PS2AlertsMetagameInstance from '../instances/PS2AlertsMetagameInstance';
import {inject, injectable} from 'inversify';
import {TYPES} from '../constants/types';
import MongooseModelFactory from './MongooseModelFactory';
import {InstanceMetagameSchemaInterface} from '../models/instance/InstanceMetagame';
import Census from '../config/census';
import {InstanceFacilityControlSchemaInterface} from '../models/instance/InstanceFacilityControlModel';
import PS2AlertsMetagameInstanceStartAction from '../actions/PS2AlertsMetagameInstanceStartAction';
import PS2AlertsMetagameInstanceEndAction from '../actions/PS2AlertsMetagameInstanceEndAction';

@injectable()
export default class InstanceActionFactory {
    private readonly instanceFacilityControlModelFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>;
    private readonly instanceMetagameModelFactory: MongooseModelFactory<InstanceMetagameSchemaInterface>;
    private readonly censusConfig: Census;

    constructor(
    @inject(TYPES.instanceFacilityControlModelFactory) instanceFacilityControlModelFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>,
        @inject(TYPES.instanceMetagameModelFactory) instanceMetagameModelFactory: MongooseModelFactory<InstanceMetagameSchemaInterface>,
        @inject('censusConfig') censusConfig: Census,
    ) {
        this.instanceFacilityControlModelFactory = instanceFacilityControlModelFactory;
        this.instanceMetagameModelFactory = instanceMetagameModelFactory;
        this.censusConfig = censusConfig;
    }

    public buildStart(instance: PS2AlertsInstanceInterface): ActionInterface {
        if (instance instanceof PS2AlertsMetagameInstance) {
            return new PS2AlertsMetagameInstanceStartAction(
                instance,
                this.instanceFacilityControlModelFactory,
                this.censusConfig,
            );
        }

        throw new ApplicationException('Unable to determine start action!', 'InstanceActionFactory');
    }

    public buildEnd(instance: PS2AlertsInstanceInterface): ActionInterface {
        if (instance instanceof PS2AlertsMetagameInstance) {
            return new PS2AlertsMetagameInstanceEndAction(
                instance,
                this.instanceFacilityControlModelFactory,
                this.instanceMetagameModelFactory,
                this.censusConfig,
            );
        }

        throw new ApplicationException('Unable to determine end action!', 'InstanceActionFactory');
    }
}
