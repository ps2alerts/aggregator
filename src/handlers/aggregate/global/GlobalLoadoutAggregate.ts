import DeathEvent from '../../ps2census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {injectable} from 'inversify';
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {Kill} from 'ps2census';
import {MqAcceptedPatterns} from '../../../ps2alerts-constants/mqAcceptedPatterns';
import ApiMQDelayPublisher from '../../../services/rabbitmq/publishers/ApiMQDelayPublisher';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import {Bracket} from '../../../ps2alerts-constants/bracket';
import FactionUtils from '../../../utils/FactionUtils';
import ExceptionHandler from '../../system/ExceptionHandler';

@injectable()
export default class GlobalLoadoutAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('GlobalLoadoutAggregate');

    constructor(
        private readonly apiMQPublisher: ApiMQPublisher,
        private readonly apiMQDelayPublisher: ApiMQDelayPublisher,
    ) {}

    public async handle(event: DeathEvent): Promise<boolean> {
        GlobalLoadoutAggregate.logger.silly('GlobalLoadoutAggregate.handle');

        const attackerFactionShort = FactionUtils.parseFactionIdToShortName(event.attackerTeamId);
        const victimFactionShort = FactionUtils.parseFactionIdToShortName(event.teamId);

        const attackerDocs = [];
        const victimDocs = [];

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

        if (attackerDocs.length > 0) {
            try {
                await this.apiMQDelayPublisher.send(new ApiMQGlobalAggregateMessage(
                    MqAcceptedPatterns.GLOBAL_LOADOUT_AGGREGATE,
                    event.instance.instanceId,
                    attackerDocs,
                    [{
                        world: event.instance.world,
                        loadout: event.attackerLoadoutId,
                    }],
                ), event.instance.duration);

                // Total bracket aggregation
                await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                    MqAcceptedPatterns.GLOBAL_LOADOUT_AGGREGATE,
                    event.instance.instanceId,
                    attackerDocs,
                    [{
                        world: event.instance.world,
                        loadout: event.attackerLoadoutId,
                    }],
                    Bracket.TOTAL,
                ));
            } catch (err) {
                new ExceptionHandler('Could not publish message to API!', err, 'GlobalLoadoutAggregate.handle.attacker');
            }
        }

        if (victimDocs.length > 0) {
            try {
                await this.apiMQDelayPublisher.send(new ApiMQGlobalAggregateMessage(
                    MqAcceptedPatterns.GLOBAL_LOADOUT_AGGREGATE,
                    event.instance.instanceId,
                    victimDocs,
                    [{
                        world: event.instance.world,
                        loadout: event.characterLoadoutId,
                    }],
                ), event.instance.duration);

                // Total Bracket aggregation
                await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                    MqAcceptedPatterns.GLOBAL_LOADOUT_AGGREGATE,
                    event.instance.instanceId,
                    victimDocs,
                    [{
                        world: event.instance.world,
                        loadout: event.characterLoadoutId,
                    }],
                    Bracket.TOTAL,
                ));
            } catch (err) {
                new ExceptionHandler('Could not publish message to API!', err, 'GlobalLoadoutAggregate.handle.character');
            }
        }

        return true;
    }
}
