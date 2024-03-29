/* eslint-disable @typescript-eslint/naming-convention,@typescript-eslint/no-unsafe-assignment */
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../ps2census/events/DeathEvent';
import {Injectable, Logger} from '@nestjs/common';
import {Kill} from 'ps2census';
import ApiMQPublisher from '../../../modules/rabbitmq/publishers/ApiMQPublisher';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {MqAcceptedPatterns} from '../../../ps2alerts-constants/mqAcceptedPatterns';
import OutfitParticipantCacheHandler from '../../OutfitParticipantCacheHandler';
import FactionUtils from '../../../utils/FactionUtils';
import ExceptionHandler from '../../system/ExceptionHandler';
import {Faction} from '../../../ps2alerts-constants/faction';

@Injectable()
export default class InstanceOutfitAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = new Logger('InstanceOutfitAggregate');

    constructor(
        private readonly apiMQPublisher: ApiMQPublisher,
        private readonly outfitParticipantCacheHandler: OutfitParticipantCacheHandler,
    ) {}

    public async handle(event: DeathEvent): Promise<boolean> {
        InstanceOutfitAggregate.logger.verbose('InstanceOutfitAggregate.handle');

        const attackerFactionShort = FactionUtils.parseFactionIdToShortName(event.attackerTeamId);
        const victimFactionShort = FactionUtils.parseFactionIdToShortName(event.teamId);

        const attackerDocs = [];
        const victimDocs = [];

        if (event.attackerCharacter.outfit) {
            attackerDocs.push({$setOnInsert: {
                outfit: event.attackerCharacter.outfit,
                durationFirstSeen: event.instance.currentDuration(),
                ps2AlertsEventType: event.instance.ps2AlertsEventType,
            }});

            // Ensure that NSO characters do not update the outfit info, while it may be wrong on insert it will eventually be correct
            if (event.attackerCharacter.faction !== Faction.NS_OPERATIVES) {
                // Ensure outfit information is always updated
                attackerDocs.push({
                    $set: {
                        outfit: event.attackerCharacter.outfit,
                    },
                });
            }
        }

        if (event.character.outfit) {
            victimDocs.push({$setOnInsert: {
                outfit: event.character.outfit,
                durationFirstSeen: event.instance.currentDuration(),
                ps2AlertsEventType: event.instance.ps2AlertsEventType,
            }});

            // Ensure that NSO characters do not update the outfit info
            if (event.character.faction !== Faction.NS_OPERATIVES) {
                // Ensure outfit information is always updated
                victimDocs.push({
                    $set: {
                        outfit: event.character.outfit,
                    },
                });
            }
        }

        // Victim deaths always counted in every case
        victimDocs.push({$inc: {deaths: 1}});

        if (event.killType === Kill.Normal) {
            attackerDocs.push({$inc: {kills: 1}});

            const factionKey = `factionKills.${attackerFactionShort}.${victimFactionShort}`;
            attackerDocs.push({$inc: {[factionKey]: 1}});
        }

        if (event.killType === Kill.TeamKill) {
            attackerDocs.push({$inc: {teamKills: 1}});
            victimDocs.push({$inc: {teamKilled: 1}});
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
                    MqAcceptedPatterns.INSTANCE_OUTFIT_AGGREGATE,
                    attackerDocs,
                    [{
                        instance: event.instance.instanceId,
                        'outfit.id': attackerOutfitId,
                        ps2AlertsEventType: event.instance.ps2AlertsEventType,
                    }],
                ));
            } catch (err) {
                new ExceptionHandler('Could not publish message to API!', err, 'InstanceOutfitAggregate.handle.attacker');
            }
        }

        try {
            await this.apiMQPublisher.send(new ApiMQMessage(
                MqAcceptedPatterns.INSTANCE_OUTFIT_AGGREGATE,
                victimDocs,
                [{
                    instance: event.instance.instanceId,
                    'outfit.id': victimOutfitId,
                    ps2AlertsEventType: event.instance.ps2AlertsEventType,
                }],
            ));
        } catch (err) {
            new ExceptionHandler('Could not publish message to API!', err, 'InstanceOutfitAggregate.handle.character');
        }

        return true;
    }
}
