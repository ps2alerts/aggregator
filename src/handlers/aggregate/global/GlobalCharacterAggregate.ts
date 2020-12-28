import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import {Kill} from 'ps2census';
import ApiMQDelayPublisher from '../../../services/rabbitmq/publishers/ApiMQDelayPublisher';
import {MQAcceptedPatterns} from '../../../constants/MQAcceptedPatterns';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import {calculateRemainingTime} from '../../../utils/InstanceRemainingTime';
import moment from 'moment/moment';

@injectable()
export default class GlobalCharacterAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('GlobalCharacterAggregate');
    private readonly apiMQPublisher: ApiMQDelayPublisher;

    constructor(@inject(TYPES.apiMQDelayPublisher) apiMQPublisher: ApiMQDelayPublisher) {
        this.apiMQPublisher = apiMQPublisher;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        GlobalCharacterAggregate.logger.silly('GlobalCharacterAggregate.handle');

        const attackerDocs = [];
        const victimDocs = [];

        attackerDocs.push({$setOnInsert: {
            world: event.character.world,
            character: event.attackerCharacter,
        }});

        victimDocs.push({$setOnInsert: {
            world: event.character.world,
            character: event.character,
        }});

        // Victim deaths always counted in every case
        victimDocs.push({$inc: {deaths: 1}});

        // NSO handling
        if (event.killType === Kill.Undetermined) {
            if (event.attackerCharacter.faction === event.character.faction) {
                attackerDocs.push({$inc: {teamKills: 1}});
            } else {
                attackerDocs.push({$inc: {kills: 1}});
            }
        }

        if (event.killType === Kill.Normal) {
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

        if (event.attackerCharacter && attackerDocs.length > 0) {
            try {
                await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                    MQAcceptedPatterns.GLOBAL_CHARACTER_AGGREGATE,
                    event.instance.instanceId,
                    attackerDocs,
                    [{
                        world: event.world,
                        'character.id': event.attackerCharacter.id,
                        date: moment('today').format(),
                    }],
                ), calculateRemainingTime(event.instance) + 30000);
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                GlobalCharacterAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
            }
        }

        try {
            await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                MQAcceptedPatterns.GLOBAL_CHARACTER_AGGREGATE,
                event.instance.instanceId,
                victimDocs,
                [{
                    world: event.world,
                    'character.id': event.character.id,
                    date: moment('today').format(),
                }],
            ), calculateRemainingTime(event.instance) + 30000);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            GlobalCharacterAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
        }

        return true;
    }
}
