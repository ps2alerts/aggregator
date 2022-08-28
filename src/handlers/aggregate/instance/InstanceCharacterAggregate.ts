/* eslint-disable @typescript-eslint/naming-convention */
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../ps2census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {injectable} from 'inversify';
import {Kill} from 'ps2census';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {MqAcceptedPatterns} from '../../../ps2alerts-constants/mqAcceptedPatterns';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import FactionUtils from '../../../utils/FactionUtils';
import ExceptionHandler from '../../system/ExceptionHandler';

@injectable()
export default class InstanceCharacterAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('InstanceCharacterAggregate');

    constructor(private readonly apiMQPublisher: ApiMQPublisher) {}

    public async handle(event: DeathEvent): Promise<boolean> {
        InstanceCharacterAggregate.logger.silly('InstanceCharacterAggregate.handle');

        const attackerFactionShort = FactionUtils.parseFactionIdToShortName(event.attackerCharacter.faction);
        const victimFactionShort = FactionUtils.parseFactionIdToShortName(event.character.faction);

        const attackerDocs = [];
        const victimDocs = [];

        attackerDocs.push({$setOnInsert: {
            character: event.attackerCharacter,
            durationFirstSeen: event.instance.currentDuration(),
        }});
        victimDocs.push({$setOnInsert: {
            character: event.character,
            durationFirstSeen: event.instance.currentDuration(),
        }});

        // Victim deaths always counted in every case
        victimDocs.push({$inc: {deaths: 1}});

        if (event.killType === Kill.Normal) {
            attackerDocs.push({$inc: {kills: 1}});
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

        // Faction vs Faction
        if (event.attackerCharacter.faction !== event.character.faction) {
            const factionKey = `factionKills.${attackerFactionShort}.${victimFactionShort}`;
            attackerDocs.push({$inc: {[factionKey]: 1}});
        }

        if (event.attackerCharacter && attackerDocs.length > 0) {
            try {
                await this.apiMQPublisher.send(new ApiMQMessage(
                    MqAcceptedPatterns.INSTANCE_CHARACTER_AGGREGATE,
                    attackerDocs,
                    [{
                        instance: event.instance.instanceId,
                        'character.id': event.attackerCharacter.id,
                    }],
                ));
            } catch (err) {
                new ExceptionHandler('Could not publish message to API!', err, 'InstanceCharacterAggregate.handle.attacker');
            }
        }

        try {
            await this.apiMQPublisher.send(new ApiMQMessage(
                MqAcceptedPatterns.INSTANCE_CHARACTER_AGGREGATE,
                victimDocs,
                [{
                    instance: event.instance.instanceId,
                    'character.id': event.character.id,
                }],
            ));
        } catch (err) {
            new ExceptionHandler('Could not publish message to API!', err, 'InstanceCharacterAggregate.handle.character');
        }

        return true;
    }
}
