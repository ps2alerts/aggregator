import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import {Kill} from 'ps2census';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {Ps2alertsApiMQEndpoints} from '../../../constants/ps2alertsApiMQEndpoints';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';

@injectable()
export default class InstanceWeaponAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('InstanceWeaponAggregate');
    private readonly apiMQPublisher: ApiMQPublisher;

    constructor(@inject(TYPES.apiMQPublisher) apiMQPublisher: ApiMQPublisher) {
        this.apiMQPublisher = apiMQPublisher;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        InstanceWeaponAggregate.logger.silly('InstanceWeaponAggregate.handle');

        const documents = [];

        if (event.killType === Kill.Normal) {
            documents.push({$inc: {kills: 1}});
        }

        if (event.killType === Kill.TeamKill) {
            documents.push({$inc: {teamKills: 1}});
        }

        if (event.killType === Kill.Suicide || event.killType === Kill.RestrictedArea) {
            documents.push({$inc: {suicides: 1}});
        }

        if (event.isHeadshot) {
            documents.push({$inc: {headshots: 1}});
        }

        try {
            await this.apiMQPublisher.send(new ApiMQMessage(
                Ps2alertsApiMQEndpoints.INSTANCE_WEAPON_AGGREGATE,
                documents,
                [{
                    instance: event.instance.instanceId,
                    weapon: event.attackerWeaponId,
                }],
            ));
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            InstanceWeaponAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
        }

        return true;
    }
}
