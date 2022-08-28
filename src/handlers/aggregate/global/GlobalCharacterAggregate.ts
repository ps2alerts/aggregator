/* eslint-disable @typescript-eslint/naming-convention */
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../ps2census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {injectable} from 'inversify';
import {Kill} from 'ps2census';
import ApiMQDelayPublisher from '../../../services/rabbitmq/publishers/ApiMQDelayPublisher';
import {MqAcceptedPatterns} from '../../../ps2alerts-constants/mqAcceptedPatterns';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import {Bracket} from '../../../ps2alerts-constants/bracket';
import FactionUtils from '../../../utils/FactionUtils';
import ExceptionHandler from '../../system/ExceptionHandler';

@injectable()
export default class GlobalCharacterAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('GlobalCharacterAggregate');

    constructor(
        private readonly apiMQPublisher: ApiMQPublisher,
        private readonly apiMQDelayPublisher: ApiMQDelayPublisher,
    ) {}

    public async handle(event: DeathEvent): Promise<boolean> {
        GlobalCharacterAggregate.logger.silly('GlobalCharacterAggregate.handle');

        const attackerFactionShort = FactionUtils.parseFactionIdToShortName(event.attackerTeamId);
        const victimFactionShort = FactionUtils.parseFactionIdToShortName(event.teamId);

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

        // Keep the character's outfit, battle rank and ASP updated
        attackerDocs.push({
            $set: {
                'character.battle_rank': event.attackerCharacter.battleRank,
                'character.asp': event.attackerCharacter.asp,
                'character.adjustedBattleRank': event.attackerCharacter.adjustedBattleRank,
                'character.outfit': event.attackerCharacter.outfit,
            },
        });

        victimDocs.push({
            $set: {
                'character.battle_rank': event.character.battleRank,
                'character.asp': event.character.asp,
                'character.adjustedBattleRank': event.character.adjustedBattleRank,
                'character.outfit': event.character.outfit,
            },
        });

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
                await this.apiMQDelayPublisher.send(new ApiMQGlobalAggregateMessage(
                    MqAcceptedPatterns.GLOBAL_CHARACTER_AGGREGATE,
                    event.instance.instanceId,
                    attackerDocs,
                    [{
                        world: event.world,
                        'character.id': event.attackerCharacter.id,
                    }],
                ), event.instance.duration);

                // Total bracket aggregation
                await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                    MqAcceptedPatterns.GLOBAL_CHARACTER_AGGREGATE,
                    event.instance.instanceId,
                    attackerDocs,
                    [{
                        world: event.world,
                        'character.id': event.attackerCharacter.id,
                    }],
                    Bracket.TOTAL,
                ));
            } catch (err) {
                new ExceptionHandler('Could not publish message to API!', err, 'GlobalCharacterAggregate.handle.attacker');
            }
        }

        try {
            await this.apiMQDelayPublisher.send(new ApiMQGlobalAggregateMessage(
                MqAcceptedPatterns.GLOBAL_CHARACTER_AGGREGATE,
                event.instance.instanceId,
                victimDocs,
                [{
                    world: event.world,
                    'character.id': event.character.id,
                }],
            ), event.instance.duration);

            // Total bracket aggregation
            await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                MqAcceptedPatterns.GLOBAL_CHARACTER_AGGREGATE,
                event.instance.instanceId,
                victimDocs,
                [{
                    world: event.world,
                    'character.id': event.character.id,
                }],
                Bracket.TOTAL,
            ));
        } catch (err) {
            new ExceptionHandler('Could not publish message to API!', err, 'GlobalCharacterAggregate.handle.character');
        }

        return true;
    }
}
