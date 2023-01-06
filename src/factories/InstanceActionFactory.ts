import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import {ActionInterface} from '../interfaces/ActionInterface';
import ApplicationException from '../exceptions/ApplicationException';
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {inject, injectable} from 'inversify';
import {TYPES} from '../constants/types';
import MetagameInstanceTerritoryStartAction from '../actions/MetagameInstanceTerritoryStartAction';
import MetagameTerritoryInstanceEndAction from '../actions/MetagameTerritoryInstanceEndAction';
import TerritoryCalculatorFactory from './TerritoryCalculatorFactory';
import MetagameInstanceTerritoryFacilityControlAction from '../actions/MetagameInstanceTerritoryFacilityControlAction';
import GlobalVictoryAggregate from '../handlers/aggregate/global/GlobalVictoryAggregate';
import OutfitParticipantCacheHandler from '../handlers/OutfitParticipantCacheHandler';
import {Rest} from 'ps2census';
import {AxiosInstance} from 'axios';
import FacilityControlEvent from '../handlers/ps2census/events/FacilityControlEvent';
import MetagameInstanceTerritoryResultAction from '../actions/MetagameInstanceTerritoryResultAction';
import Redis from 'ioredis';
import ZoneDataParser from '../parsers/ZoneDataParser';
import {MetagameTerritoryControlResultInterface} from '../ps2alerts-constants/interfaces/MetagameTerritoryControlResultInterface';
import OutfitWarsTerritoryInstance from '../instances/OutfitWarsTerritoryInstance';
import {OutfitwarsTerritoryResultInterface} from '../ps2alerts-constants/interfaces/OutfitwarsTerritoryResultInterface';
import OutfitwarsTerritoryInstanceResultAction
    from '../actions/OutfitwarsTerritoryInstanceResultAction';
import OutfitwarsTerritoryInstanceStartAction from '../actions/OutfitwarsTerritoryInstanceStartAction';
import OutfitwarsTerritoryInstanceEndAction from '../actions/OutfitwarsTerritoryInstanceEndAction';
import OutfitwarsTerritoryFacilityControlAction from '../actions/OutfitwarsTerritoryFacilityControlAction';
import OutfitwarsTerritoryTeamAction from '../actions/OutfitwarsTerritoryTeamAction';
import OutfitwarsTerritoryDeathAction from '../actions/OutfitwarsTerritoryDeathAction';
import DeathEvent from '../handlers/ps2census/events/DeathEvent';
import StatisticsHandler from '../handlers/StatisticsHandler';

@injectable()
export default class InstanceActionFactory {
    constructor(
        private readonly territoryCalculatorFactory: TerritoryCalculatorFactory,
        @inject(TYPES.globalVictoryAggregate) private readonly globalVictoryAggregate: GlobalVictoryAggregate,
        private readonly outfitParticipantCacheHandler: OutfitParticipantCacheHandler,
        private readonly restClient: Rest.Client,
        @inject(TYPES.ps2AlertsApiClient) private readonly ps2AlertsApiClient: AxiosInstance,
        private readonly cacheClient: Redis,
        private readonly zoneDataParser: ZoneDataParser,
        private readonly statisticsHandler: StatisticsHandler,
    ) {}

    public buildStart(
        instance: PS2AlertsInstanceInterface,
    ): ActionInterface<boolean> {
        if (instance instanceof MetagameTerritoryInstance) {
            return new MetagameInstanceTerritoryStartAction(
                instance,
                this.ps2AlertsApiClient,
                this.restClient,
                this.cacheClient,
                this.zoneDataParser,
                this.statisticsHandler,
            );
        }

        if (instance instanceof OutfitWarsTerritoryInstance) {
            return new OutfitwarsTerritoryInstanceStartAction(
                instance,
                this.ps2AlertsApiClient,
                this.restClient,
                this.cacheClient,
                this.zoneDataParser,
            );
        }

        throw new ApplicationException('Unable to determine start action!', 'InstanceActionFactory');
    }

    public buildEnd(
        instance: PS2AlertsInstanceInterface,
    ): ActionInterface<boolean> {
        if (instance instanceof MetagameTerritoryInstance) {
            return new MetagameTerritoryInstanceEndAction(
                instance,
                this.buildMetagameTerritoryResult(instance),
                this.ps2AlertsApiClient,
                this.globalVictoryAggregate,
                this.outfitParticipantCacheHandler,
                this.statisticsHandler,
            );
        }

        if (instance instanceof OutfitWarsTerritoryInstance) {
            return new OutfitwarsTerritoryInstanceEndAction(
                instance,
                this.buildOutfitwarsResult(instance),
                this.ps2AlertsApiClient,
                this.globalVictoryAggregate,
                this.outfitParticipantCacheHandler,
            );
        }

        throw new ApplicationException('Unable to determine endAction!', 'InstanceActionFactory');
    }

    public buildFacilityControlEvent(
        event: FacilityControlEvent,
    ): ActionInterface<boolean> {
        if (event.instance instanceof MetagameTerritoryInstance) {
            return new MetagameInstanceTerritoryFacilityControlAction(
                event,
                this.buildMetagameTerritoryResult(event.instance),
                this.ps2AlertsApiClient,
                this.statisticsHandler,
            );
        }

        if (event.instance instanceof OutfitWarsTerritoryInstance) {
            return new OutfitwarsTerritoryFacilityControlAction(
                event,
                this.buildOutfitwarsResult(event.instance),
                this.buildOutfitwarsTeam(event.instance, event),
                this.ps2AlertsApiClient,
            );
        }

        throw new ApplicationException('Unable to determine facilityControlEventAction!', 'InstanceActionFactory');
    }

    public buildMetagameTerritoryResult(
        instance: MetagameTerritoryInstance,
    ): ActionInterface<MetagameTerritoryControlResultInterface> {
        return new MetagameInstanceTerritoryResultAction(
            instance,
            this.territoryCalculatorFactory.buildMetagameTerritoryCalculator(instance, this.restClient),
            this.ps2AlertsApiClient,
            this.statisticsHandler,
        );
    }

    public buildOutfitwarsResult(
        instance: OutfitWarsTerritoryInstance,
    ): ActionInterface<OutfitwarsTerritoryResultInterface> {
        return new OutfitwarsTerritoryInstanceResultAction(
            instance,
            this.territoryCalculatorFactory.buildOutfitwarsTerritoryCalculator(instance, this.restClient),
            this.ps2AlertsApiClient,
        );
    }

    public buildOutfitwarsTeam(
        instance: OutfitWarsTerritoryInstance,
        facilityControl: FacilityControlEvent,
    ): ActionInterface<boolean> {
        return new OutfitwarsTerritoryTeamAction(instance, facilityControl, this.restClient, this.ps2AlertsApiClient);
    }

    public buildOutfitwarsDeath(
        event: DeathEvent,
    ): ActionInterface<boolean> {
        return new OutfitwarsTerritoryDeathAction(event, this.ps2AlertsApiClient);
    }
}
