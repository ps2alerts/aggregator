import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import {Kill} from 'ps2census';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {MQAcceptedPatterns} from '../../../constants/MQAcceptedPatterns';
import OutfitParticipantCacheHandler from '../../OutfitParticipantCacheHandler';

@injectable()
export default class InstanceOutfitAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('InstanceOutfitAggregate');
    private readonly apiMQPublisher: ApiMQPublisher;
    private readonly outfitParticipantCacheHandler: OutfitParticipantCacheHandler;

    constructor(
    @inject(TYPES.apiMQPublisher) apiMQPublisher: ApiMQPublisher,
        @inject(TYPES.outfitParticipantCacheHandler) outfitParticipantCacheHandler: OutfitParticipantCacheHandler,
    ) {
        this.apiMQPublisher = apiMQPublisher;
        this.outfitParticipantCacheHandler = outfitParticipantCacheHandler;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        InstanceOutfitAggregate.logger.silly('InstanceOutfitAggregate.handle');

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

        // Outfit participant tracking
        if (event.killType !== Kill.Suicide) {
            await this.outfitParticipantCacheHandler.addOutfit(attackerOutfitId, event.attackerCharacter.id, event.instance.instanceId);
        }

        await this.outfitParticipantCacheHandler.addOutfit(victimOutfitId, event.character.id, event.instance.instanceId);

        // Tot up the participants then add it to the docs
        if (event.killType !== Kill.Suicide) {
            attackerDocs.push({$set: {participants: await this.outfitParticipantCacheHandler.getOutfitParticipants(attackerOutfitId, event.instance.instanceId)}});
        }

        victimDocs.push({$set: {participants: await this.outfitParticipantCacheHandler.getOutfitParticipants(victimOutfitId, event.instance.instanceId)}});

        if (attackerDocs.length > 0) {
            try {
                await this.apiMQPublisher.send(new ApiMQMessage(
                    MQAcceptedPatterns.INSTANCE_OUTFIT_AGGREGATE,
                    attackerDocs,
                    [{
                        instance: event.instance.instanceId,
                        'outfit.id': attackerOutfitId,
                    }],
                ));
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                InstanceOutfitAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
            }
        }

        try {
            await this.apiMQPublisher.send(new ApiMQMessage(
                MQAcceptedPatterns.INSTANCE_OUTFIT_AGGREGATE,
                victimDocs,
                [{
                    instance: event.instance.instanceId,
                    'outfit.id': victimOutfitId,
                }],
            ));
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            InstanceOutfitAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
        }

        return true;
    }
}
