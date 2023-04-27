/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {ActionInterface} from '../interfaces/ActionInterface';
import ApplicationException from '../exceptions/ApplicationException';
import GlobalVictoryAggregate from '../handlers/aggregate/global/GlobalVictoryAggregate';
import OutfitParticipantCacheHandler from '../handlers/OutfitParticipantCacheHandler';
import {ps2AlertsApiEndpoints} from '../ps2alerts-constants/ps2AlertsApiEndpoints';
import {Ps2AlertsEventState} from '../ps2alerts-constants/ps2AlertsEventState';
import {OutfitwarsTerritoryResultInterface} from '../ps2alerts-constants/interfaces/OutfitwarsTerritoryResultInterface';
import OutfitWarsTerritoryInstance from '../instances/OutfitWarsTerritoryInstance';
import {Logger} from '@nestjs/common';
import {PS2AlertsApiDriver} from '../drivers/PS2AlertsApiDriver';

export default class OutfitwarsTerritoryInstanceEndAction implements ActionInterface<boolean> {
    private static readonly logger = new Logger('OutfitwarsTerritoryInstanceEndAction');

    constructor(
        private readonly instance: OutfitWarsTerritoryInstance,
        private readonly territoryResultAction: ActionInterface<OutfitwarsTerritoryResultInterface>,
        private readonly ps2alertsApiClient: PS2AlertsApiDriver,
        private readonly globalVictoryAggregate: GlobalVictoryAggregate,
        private readonly outfitParticipantCacheHandler: OutfitParticipantCacheHandler,
    ) {}

    public async execute(): Promise<boolean> {
        OutfitwarsTerritoryInstanceEndAction.logger.log(`[${this.instance.instanceId}] Running endAction`);

        // TODO: Implement for OW properly

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
            // ffs es-lint
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            ps2AlertsApiEndpoints.outfitwarsInstance.replace('{instanceId}', this.instance.instanceId),
            data,
        ).catch((err: Error) => {
            throw new ApplicationException(`[${this.instance.instanceId}] Unable to mark Outfit Wars Instance as ended via API! Err: ${err.message} - Data: ${JSON.stringify(data)}`, 'OutfitwarsTerritoryInstanceEndAction');
        });

        // Update the final result of the instance
        const result: OutfitwarsTerritoryResultInterface = await this.territoryResultAction.execute();

        if (!result) {
            throw new ApplicationException(`[${this.instance.instanceId}] UNABLE TO CALCULATE VICTOR!`, 'OutfitwarsTerritoryInstanceEndAction');
        }

        // Update the world, zone and bracket aggregators
        // await this.globalVictoryAggregate.handle(this.instance);

        // Remove the outfit participant set data from Redis
        await this.outfitParticipantCacheHandler.flushOutfits(this.instance.instanceId);

        return true;
    }
}
