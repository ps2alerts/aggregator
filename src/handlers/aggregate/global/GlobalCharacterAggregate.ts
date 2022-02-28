import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import {Kill} from 'ps2census';
import ApiMQDelayPublisher from '../../../services/rabbitmq/publishers/ApiMQDelayPublisher';
import {MQAcceptedPatterns} from '../../../constants/MQAcceptedPatterns';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import {Bracket} from '../../../constants/bracket';
import FactionUtils from '../../../utils/FactionUtils';

@injectable()
export default class GlobalCharacterAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('GlobalCharacterAggregate');
    private readonly apiMQPublisher: ApiMQPublisher;
    private readonly apiMQDelayPublisher: ApiMQDelayPublisher;

    constructor(
    @inject(TYPES.apiMQPublisher) apiMQPublisher: ApiMQPublisher,
        @inject(TYPES.apiMQDelayPublisher) apiMQDelayPublisher: ApiMQDelayPublisher,
    ) {
        this.apiMQPublisher = apiMQPublisher;
        this.apiMQDelayPublisher = apiMQDelayPublisher;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        GlobalCharacterAggregate.logger.silly('GlobalCharacterAggregate.handle');

        const attackerFactionShort = FactionUtils.parseFactionIdToShortName(event.attackerCharacter.faction);
        const victimFactionShort = FactionUtils.parseFactionIdToShortName(event.character.faction);

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
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'character.battle_rank': event.attackerCharacter.battleRank,
                'character.asp': event.attackerCharacter.asp,
                'character.adjustedBattleRank': event.attackerCharacter.adjustedBattleRank,
                'character.outfit': event.attackerCharacter.outfit,
            },
        });

        victimDocs.push({
            $set: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                'character.battle_rank': event.character.battleRank,
                'character.asp': event.character.asp,
                'character.adjustedBattleRank': event.character.adjustedBattleRank,
                'character.outfit': event.character.outfit,
            },
        });

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
                    MQAcceptedPatterns.GLOBAL_CHARACTER_AGGREGATE,
                    event.instance.instanceId,
                    attackerDocs,
                    [{
                        world: event.world,
                        'character.id': event.attackerCharacter.id,
                    }],
                ), event.instance.duration);

                // Total bracket aggregation
                await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                    MQAcceptedPatterns.GLOBAL_CHARACTER_AGGREGATE,
                    event.instance.instanceId,
                    attackerDocs,
                    [{
                        world: event.world,
                        'character.id': event.attackerCharacter.id,
                    }],
                    Bracket.TOTAL,
                ));
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                GlobalCharacterAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
            }
        }

        try {
            await this.apiMQDelayPublisher.send(new ApiMQGlobalAggregateMessage(
                MQAcceptedPatterns.GLOBAL_CHARACTER_AGGREGATE,
                event.instance.instanceId,
                victimDocs,
                [{
                    world: event.world,
                    'character.id': event.character.id,
                }],
            ), event.instance.duration);

            // Total bracket aggregation
            await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                MQAcceptedPatterns.GLOBAL_CHARACTER_AGGREGATE,
                event.instance.instanceId,
                victimDocs,
                [{
                    world: event.world,
                    'character.id': event.character.id,
                }],
                Bracket.TOTAL,
            ));
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            GlobalCharacterAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
        }

        return true;
    }
}
