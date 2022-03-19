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
import TerritoryCalculatorFactory from './TerritoryCalculatorFactory';
import MetagameInstanceTerritoryFacilityControlAction from '../actions/MetagameInstanceTerritoryFacilityControlAction';
import GlobalVictoryAggregate from '../handlers/aggregate/global/GlobalVictoryAggregate';
import {CensusEnvironment} from '../types/CensusEnvironment';
import OutfitParticipantCacheHandler from '../handlers/OutfitParticipantCacheHandler';
import CensusStream from '../services/census/CensusStream';

@injectable()
export default class InstanceActionFactory {
    constructor(
        @inject(TYPES.instanceFacilityControlModelFactory) private readonly instanceFacilityControlModelFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>,
        @inject(TYPES.instanceMetagameModelFactory) private readonly instanceMetagameModelFactory: MongooseModelFactory<InstanceMetagameTerritorySchemaInterface>,
        @inject(TYPES.censusConfig) private readonly censusConfig: Census,
        @inject(TYPES.territoryCalculatorFactory) private readonly territoryCalculatorFactory: TerritoryCalculatorFactory,
        @inject(TYPES.globalVictoryAggregate) private readonly globalVictoryAggregate: GlobalVictoryAggregate,
        @inject(TYPES.outfitParticipantCacheHandler) private readonly outfitParticipantCacheHandler: OutfitParticipantCacheHandler,
        private readonly censusStreamService: CensusStream,
    ) {}

    public buildStart(
        instance: PS2AlertsInstanceInterface,
        environment: CensusEnvironment,
    ): ActionInterface {
        if (instance instanceof MetagameTerritoryInstance) {
            return new MetagameInstanceTerritoryStartAction(
                instance,
                environment,
                this.instanceMetagameModelFactory,
                this.instanceFacilityControlModelFactory,
                this.censusConfig,
                this.buildFacilityControlEvent(instance, environment, false),
                this.censusStreamService,
            );
        }

        throw new ApplicationException('Unable to determine start action!', 'InstanceActionFactory');
    }

    public buildEnd(
        instance: PS2AlertsInstanceInterface,
        environment: CensusEnvironment,
    ): ActionInterface {
        if (instance instanceof MetagameTerritoryInstance) {
            return new MetagameTerritoryInstanceEndAction(
                instance,
                environment,
                this.instanceMetagameModelFactory,
                this.territoryCalculatorFactory.build(instance, environment, this.censusStreamService),
                this.globalVictoryAggregate,
                this.outfitParticipantCacheHandler,
            );
        }

        throw new ApplicationException('Unable to determine endAction!', 'InstanceActionFactory');
    }

    public buildFacilityControlEvent(
        instance: PS2AlertsInstanceInterface,
        environment: CensusEnvironment,
        isDefence: boolean,
    ): ActionInterface {
        if (instance instanceof MetagameTerritoryInstance) {
            return new MetagameInstanceTerritoryFacilityControlAction(
                instance,
                environment,
                this.instanceMetagameModelFactory,
                this.territoryCalculatorFactory.build(instance, environment, this.censusStreamService),
                isDefence,
            );
        }

        throw new ApplicationException('Unable to determine facilityControlEventAction!', 'InstanceActionFactory');
    }
}
