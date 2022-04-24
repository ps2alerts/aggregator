import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {getLogger} from '../logger';
import {ActionInterface} from '../interfaces/ActionInterface';
import ApplicationException from '../exceptions/ApplicationException';
import FactionUtils from '../utils/FactionUtils';
import GlobalVictoryAggregate from '../handlers/aggregate/global/GlobalVictoryAggregate';
import OutfitParticipantCacheHandler from '../handlers/OutfitParticipantCacheHandler';
import TerritoryResultInterface from '../interfaces/TerritoryResultInterface';
import {ps2AlertsApiEndpoints} from '../constants/ps2AlertsApiEndpoints';
import {AxiosInstance} from 'axios';
import {Ps2alertsEventState} from '../constants/ps2alertsEventState';

export default class MetagameTerritoryInstanceEndAction implements ActionInterface<boolean> {
    private static readonly logger = getLogger('MetagameTerritoryInstanceEndAction');

    constructor(
        private readonly instance: MetagameTerritoryInstance,
        private readonly territoryResultAction: ActionInterface<TerritoryResultInterface>,
        private readonly ps2alertsApiClient: AxiosInstance,
        private readonly globalVictoryAggregate: GlobalVictoryAggregate,
        private readonly outfitParticipantCacheHandler: OutfitParticipantCacheHandler,
    ) {}

    public async execute(): Promise<boolean> {
        MetagameTerritoryInstanceEndAction.logger.info(`[${this.instance.instanceId}] Running endAction`);

        // Mark instance as ended in memory so we can calculate victor properly
        this.instance.state = Ps2alertsEventState.ENDED;

        const data = {
            state: Ps2alertsEventState.ENDED,
            timeEnded: new Date().toISOString(),
        };

        // Mark the instance as ended in the database BEFORE we calculate territory (it's more prone to failure)
        await this.ps2alertsApiClient.patch(
            ps2AlertsApiEndpoints.instancesInstance.replace('{instanceId}', this.instance.instanceId),
            data,
        ).catch((err: Error) => {
            throw new ApplicationException(`[${this.instance.instanceId}] Unable to mark Instance as ended via API! Err: ${err.message} - Data: ${JSON.stringify(data)}`);
        });

        // Update the final result of the instance
        const result: TerritoryResultInterface = await this.territoryResultAction.execute();

        if (!result) {
            throw new ApplicationException(`[${this.instance.instanceId}] UNABLE TO CALCULATE VICTOR!`, 'MetagameTerritoryInstanceEndAction');
        }

        if (result.draw) {
            MetagameTerritoryInstanceEndAction.logger.info(`[${this.instance.instanceId}] resulted in a DRAW!`);
        } else {
            MetagameTerritoryInstanceEndAction.logger.info(`[${this.instance.instanceId}] victor is: ${FactionUtils.parseFactionIdToShortName(result.victor).toUpperCase()}!`);
        }

        // Update the world, zone and bracket aggregators
        await this.globalVictoryAggregate.handle(this.instance);

        // Remove the outfit participant set data from Redis
        await this.outfitParticipantCacheHandler.flushOutfits(this.instance.instanceId);

        return true;
    }
}
