import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {Kill} from 'ps2census';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {MQAcceptedPatterns} from '../../../constants/MQAcceptedPatterns';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';

@injectable()
export default class InstanceClassAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('InstanceClassAggregate');
    private readonly apiMQPublisher: ApiMQPublisher;

    constructor(@inject(TYPES.apiMQPublisher) apiMQPublisher: ApiMQPublisher) {
        this.apiMQPublisher = apiMQPublisher;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        InstanceClassAggregate.logger.silly('InstanceClassAggregate.handle');

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

        if (event.isHeadshot) {
            attackerDocs.push({$inc: {headshots: 1}});
        }

        if (event.attackerCharacter && attackerDocs.length > 0) {
            try {
                await this.apiMQPublisher.send(new ApiMQMessage(
                    MQAcceptedPatterns.INSTANCE_CLASS_AGGREGATE,
                    attackerDocs,
                    [{
                        instance: event.instance.instanceId,
                        class: event.attackerLoadoutId,
                    }],
                ));
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                InstanceClassAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
            }
        }

        try {
            await this.apiMQPublisher.send(new ApiMQMessage(
                MQAcceptedPatterns.INSTANCE_CLASS_AGGREGATE,
                victimDocs,
                [{
                    instance: event.instance.instanceId,
                    class: event.characterLoadoutId,
                }],
            ));
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            InstanceClassAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
        }

        return true;
    }
}
