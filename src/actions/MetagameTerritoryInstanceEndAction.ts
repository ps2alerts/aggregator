/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {ActionInterface} from '../interfaces/ActionInterface';
import ApplicationException from '../exceptions/ApplicationException';
import FactionUtils from '../utils/FactionUtils';
import GlobalVictoryAggregate from '../handlers/aggregate/global/GlobalVictoryAggregate';
import OutfitParticipantCacheHandler from '../handlers/OutfitParticipantCacheHandler';
import {ps2AlertsApiEndpoints} from '../ps2alerts-constants/ps2AlertsApiEndpoints';
import {AxiosInstance} from 'axios';
import {Ps2AlertsEventState} from '../ps2alerts-constants/ps2AlertsEventState';
import {
    MetagameTerritoryControlResultInterface,
} from '../ps2alerts-constants/interfaces/MetagameTerritoryControlResultInterface';
import {Logger} from '@nestjs/common';
import StatisticsHandler, {MetricTypes} from '../handlers/StatisticsHandler';

export default class MetagameTerritoryInstanceEndAction implements ActionInterface<boolean> {
    private static readonly logger = new Logger('MetagameTerritoryInstanceEndAction');

    constructor(
        private readonly instance: MetagameTerritoryInstance,
        private readonly territoryResultAction: ActionInterface<MetagameTerritoryControlResultInterface>,
        private readonly ps2alertsApiClient: AxiosInstance,
        private readonly globalVictoryAggregate: GlobalVictoryAggregate,
        private readonly outfitParticipantCacheHandler: OutfitParticipantCacheHandler,
        private readonly statisticsHandler: StatisticsHandler,
    ) {}

    public async execute(): Promise<boolean> {
        MetagameTerritoryInstanceEndAction.logger.log(`[${this.instance.instanceId}] Running endAction`);

        const endTime = new Date();

        // Mark instance as ended in memory so we can calculate victor properly
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.instance.state = Ps2AlertsEventState.ENDED;
        this.instance.timeEnded = endTime;

        const data = {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            state: Ps2AlertsEventState.ENDED,
            timeEnded: endTime.toISOString(),
        };

        // Mark the instance as ended in the database BEFORE we calculate territory (it's more prone to failure)
        await this.ps2alertsApiClient.patch(
            ps2AlertsApiEndpoints.instancesInstance.replace('{instanceId}', this.instance.instanceId),
            data,
        ).then(async () => {
            await this.statisticsHandler.logMetric(endTime, MetricTypes.PS2ALERTS_API_INSTANCE, true);
        }).catch(async (err: Error) => {
            await this.statisticsHandler.logMetric(endTime, MetricTypes.PS2ALERTS_API_INSTANCE, false);

            throw new ApplicationException(`[${this.instance.instanceId}] Unable to mark Instance as ended via API! Err: ${err.message} - Data: ${JSON.stringify(data)}`);
        });

        // Update the final result of the instance
        const result: MetagameTerritoryControlResultInterface = await this.territoryResultAction.execute();

        if (!result) {
            throw new ApplicationException(`[${this.instance.instanceId}] UNABLE TO CALCULATE VICTOR!`, 'MetagameTerritoryInstanceEndAction');
        }

        if (result.draw) {
            MetagameTerritoryInstanceEndAction.logger.log(`[${this.instance.instanceId}] resulted in a DRAW!`);
        } else {
            MetagameTerritoryInstanceEndAction.logger.log(`[${this.instance.instanceId}] victor is: ${FactionUtils.parseFactionIdToShortName(result.victor).toUpperCase()}!`);
        }

        // Update the world, zone and bracket aggregators
        await this.globalVictoryAggregate.handle(this.instance);

        // Remove the outfit participant set data from Redis
        await this.outfitParticipantCacheHandler.flushOutfits(this.instance.instanceId);

        return true;
    }
}
