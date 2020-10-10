import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import {ActionInterface} from '../interfaces/ActionInterface';
import ApplicationException from '../exceptions/ApplicationException';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {inject, injectable} from 'inversify';
import {TYPES} from '../constants/types';
import MongooseModelFactory from './MongooseModelFactory';
import {InstanceMetagameTerritorySchemaInterface} from '../models/instance/InstanceMetagameTerritory';
import Census from '../config/census';
import {InstanceFacilityControlSchemaInterface} from '../models/instance/InstanceFacilityControlModel';
import MetagameInstanceTerritoryStartAction from '../actions/MetagameInstanceTerritoryStartAction';
import MetagameTerritoryInstanceEndAction from '../actions/MetagameTerritoryInstanceEndAction';

@injectable()
export default class InstanceActionFactory {
    private readonly instanceFacilityControlModelFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>;
    private readonly instanceMetagameModelFactory: MongooseModelFactory<InstanceMetagameTerritorySchemaInterface>;
    private readonly censusConfig: Census;

    constructor(
    @inject(TYPES.instanceFacilityControlModelFactory) instanceFacilityControlModelFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>,
        @inject(TYPES.instanceMetagameModelFactory) instanceMetagameModelFactory: MongooseModelFactory<InstanceMetagameTerritorySchemaInterface>,
        @inject('censusConfig') censusConfig: Census,
    ) {
        this.instanceFacilityControlModelFactory = instanceFacilityControlModelFactory;
        this.instanceMetagameModelFactory = instanceMetagameModelFactory;
        this.censusConfig = censusConfig;
    }

    public buildStart(instance: PS2AlertsInstanceInterface): ActionInterface {
        if (instance instanceof MetagameTerritoryInstance) {
            return new MetagameInstanceTerritoryStartAction(
                instance,
                this.instanceFacilityControlModelFactory,
                this.censusConfig,
            );
        }

        throw new ApplicationException('Unable to determine start action!', 'InstanceActionFactory');
    }

    public buildEnd(instance: PS2AlertsInstanceInterface): ActionInterface {
        if (instance instanceof MetagameTerritoryInstance) {
            return new MetagameTerritoryInstanceEndAction(
                instance,
                this.instanceFacilityControlModelFactory,
                this.instanceMetagameModelFactory,
                this.censusConfig,
            );
        }

        throw new ApplicationException('Unable to determine end action!', 'InstanceActionFactory');
    }
}
