import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import {ActionInterface} from '../interfaces/ActionInterface';
import ApplicationException from '../exceptions/ApplicationException';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {inject, injectable} from 'inversify';
import {TYPES} from '../constants/types';
import MongooseModelFactory from './MongooseModelFactory';
import {InstanceMetagameTerritorySchemaInterface} from '../models/instance/InstanceMetagameTerritory';
import {InstanceFacilityControlSchemaInterface} from '../models/instance/InstanceFacilityControlModel';
import MetagameInstanceTerritoryStartAction from '../actions/MetagameInstanceTerritoryStartAction';
import MetagameTerritoryInstanceEndAction from '../actions/MetagameTerritoryInstanceEndAction';
import TerritoryCalculatorFactory from './TerritoryCalculatorFactory';
import MetagameInstanceTerritoryFacilityControlAction from '../actions/MetagameInstanceTerritoryFacilityControlAction';
import GlobalVictoryAggregate from '../handlers/aggregate/global/GlobalVictoryAggregate';
import OutfitParticipantCacheHandler from '../handlers/OutfitParticipantCacheHandler';
import {RestClient} from 'ps2census/dist/rest';

@injectable()
export default class InstanceActionFactory {
    constructor(
        @inject(TYPES.instanceFacilityControlModelFactory) private readonly instanceFacilityControlModelFactory: MongooseModelFactory<InstanceFacilityControlSchemaInterface>,
        @inject(TYPES.instanceMetagameModelFactory) private readonly instanceMetagameModelFactory: MongooseModelFactory<InstanceMetagameTerritorySchemaInterface>,
        private readonly territoryCalculatorFactory: TerritoryCalculatorFactory,
        @inject(TYPES.globalVictoryAggregate) private readonly globalVictoryAggregate: GlobalVictoryAggregate,
        private readonly outfitParticipantCacheHandler: OutfitParticipantCacheHandler,
        private readonly restClient: RestClient,
    ) {}

    public buildStart(
        instance: PS2AlertsInstanceInterface,
    ): ActionInterface {
        if (instance instanceof MetagameTerritoryInstance) {
            return new MetagameInstanceTerritoryStartAction(
                instance,
                this.instanceMetagameModelFactory,
                this.instanceFacilityControlModelFactory,
                this.buildFacilityControlEvent(instance, false),
                this.restClient,
            );
        }

        throw new ApplicationException('Unable to determine start action!', 'InstanceActionFactory');
    }

    public buildEnd(
        instance: PS2AlertsInstanceInterface,
    ): ActionInterface {
        if (instance instanceof MetagameTerritoryInstance) {
            return new MetagameTerritoryInstanceEndAction(
                instance,
                this.instanceMetagameModelFactory,
                this.territoryCalculatorFactory.build(instance, this.restClient),
                this.globalVictoryAggregate,
                this.outfitParticipantCacheHandler,
            );
        }

        throw new ApplicationException('Unable to determine endAction!', 'InstanceActionFactory');
    }

    public buildFacilityControlEvent(
        instance: PS2AlertsInstanceInterface,
        isDefence: boolean,
    ): ActionInterface {
        if (instance instanceof MetagameTerritoryInstance) {
            return new MetagameInstanceTerritoryFacilityControlAction(
                instance,
                this.instanceMetagameModelFactory,
                this.territoryCalculatorFactory.build(instance, this.restClient),
                isDefence,
            );
        }

        throw new ApplicationException('Unable to determine facilityControlEventAction!', 'InstanceActionFactory');
    }
}
