import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {Kill} from 'ps2census';
import {MQAcceptedPatterns} from '../../../constants/MQAcceptedPatterns';
import ApiMQDelayPublisher from '../../../services/rabbitmq/publishers/ApiMQDelayPublisher';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import {calculateRemainingTime} from '../../../utils/InstanceRemainingTime';

@injectable()
export default class GlobalLoadoutAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('GlobalLoadoutAggregate');
    private readonly apiMQPublisher: ApiMQDelayPublisher;

    constructor(@inject(TYPES.apiMQDelayPublisher) apiMQPublisher: ApiMQDelayPublisher) {
        this.apiMQPublisher = apiMQPublisher;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        GlobalLoadoutAggregate.logger.silly('GlobalLoadoutAggregate.handle');

        const attackerDocs = [];
        const victimDocs = [];

        // Victim deaths always counted in every case
        victimDocs.push({$inc: {deaths: 1}});

        if (event.killType === Kill.Normal || event.killType === Kill.Undetermined) {
            attackerDocs.push({$inc: {kills: 1}});
        }

        if (event.killType === Kill.TeamKill) {
            attackerDocs.push({$inc: {teamKills: 1}});
        }

        if (event.killType === Kill.Suicide || event.killType === Kill.RestrictedArea) {
            // Attacker and victim are the same here, so it doesn't matter which
            victimDocs.push({$inc: {suicides: 1}});
        }

        if (event.isHeadshot && event.killType !== Kill.TeamKill) {
            attackerDocs.push({$inc: {headshots: 1}});
        }

        if (attackerDocs.length > 0) {
            try {
                await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                    MQAcceptedPatterns.GLOBAL_LOADOUT_AGGREGATE,
                    event.instance.instanceId,
                    attackerDocs,
                    [{
                        world: event.instance.world,
                        loadout: event.attackerLoadoutId,
                    }],
                ), calculateRemainingTime(event.instance) + 30000);
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                GlobalLoadoutAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
            }
        }

        if (victimDocs.length > 0) {
            try {
                await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                    MQAcceptedPatterns.GLOBAL_LOADOUT_AGGREGATE,
                    event.instance.instanceId,
                    victimDocs,
                    [{
                        world: event.instance.world,
                        loadout: event.characterLoadoutId,
                    }],
                ), calculateRemainingTime(event.instance) + 30000);
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                GlobalLoadoutAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
            }
        }

        return true;
    }
}
