import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import {Kill} from 'ps2census';
import {MQAcceptedPatterns} from '../../../constants/MQAcceptedPatterns';
import ApiMQDelayPublisher from '../../../services/rabbitmq/publishers/ApiMQDelayPublisher';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import {calculateRemainingTime} from '../../../utils/InstanceRemainingTime';

@injectable()
export default class GlobalOutfitAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('GlobalOutfitAggregate');
    private readonly apiMQPublisher: ApiMQDelayPublisher;

    constructor(@inject(TYPES.apiMQDelayPublisher) apiMQPublisher: ApiMQDelayPublisher) {
        this.apiMQPublisher = apiMQPublisher;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        GlobalOutfitAggregate.logger.silly('GlobalOutfitAggregate.handle');

        const attackerDocs = [];
        const victimDocs = [];

        if (event.attackerCharacter.outfit) {
            attackerDocs.push({$setOnInsert: {
                outfit: event.attackerCharacter.outfit,
            }});
        }

        if (event.character.outfit) {
            victimDocs.push({$setOnInsert: {
                outfit: event.character.outfit,
            }});
        }

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

        // Purpose for this is we can aggregate stats for "outfitless" characters, e.g. TR (-3) got X kills
        const attackerOutfitId = event.attackerCharacter.outfit ? event.attackerCharacter.outfit.id : `-${event.attackerCharacter.faction}`;
        const victimOutfitId = event.character.outfit ? event.character.outfit.id : `-${event.character.faction}`;

        if (attackerDocs.length > 0) {
            try {
                await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                    MQAcceptedPatterns.GLOBAL_OUTFIT_AGGREGATE,
                    event.instance.instanceId,
                    attackerDocs,
                    [{
                        world: event.world,
                        'outfit.id': attackerOutfitId,
                    }],
                ), calculateRemainingTime(event.instance) + 30000);
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                GlobalOutfitAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
            }
        }

        try {
            await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                MQAcceptedPatterns.GLOBAL_OUTFIT_AGGREGATE,
                event.instance.instanceId,
                victimDocs,
                [{
                    world: event.world,
                    'outfit.id': victimOutfitId,
                }],
            ), calculateRemainingTime(event.instance) + 30000);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            GlobalOutfitAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
        }

        return true;
    }
}
