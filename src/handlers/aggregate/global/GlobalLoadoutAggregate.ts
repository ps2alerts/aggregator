import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {Kill} from 'ps2census';
import {MQAcceptedPatterns} from '../../../constants/MQAcceptedPatterns';
import ApiMQDelayPublisher from '../../../services/rabbitmq/publishers/ApiMQDelayPublisher';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import {Bracket} from '../../../constants/bracket';
import FactionUtils from '../../../utils/FactionUtils';

@injectable()
export default class GlobalLoadoutAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('GlobalLoadoutAggregate');
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
        GlobalLoadoutAggregate.logger.silly('GlobalLoadoutAggregate.handle');

        const attackerFactionShort = FactionUtils.parseFactionIdToShortName(event.attackerCharacter.faction);
        const victimFactionShort = FactionUtils.parseFactionIdToShortName(event.character.faction);

        const attackerDocs = [];
        const victimDocs = [];

        // Victim deaths always counted in every case
        victimDocs.push({$inc: {deaths: 1}});

        if (event.killType === Kill.Normal || event.killType === Kill.Undetermined) {
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
                    MQAcceptedPatterns.GLOBAL_LOADOUT_AGGREGATE,
                    event.instance.instanceId,
                    attackerDocs,
                    [{
                        world: event.instance.world,
                        loadout: event.attackerLoadoutId,
                    }],
                ), event.instance.duration);

                // Total bracket aggregation
                await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                    MQAcceptedPatterns.GLOBAL_LOADOUT_AGGREGATE,
                    event.instance.instanceId,
                    attackerDocs,
                    [{
                        world: event.instance.world,
                        loadout: event.attackerLoadoutId,
                    }],
                    Bracket.TOTAL,
                ));
            } catch (err) {
                if (err instanceof Error) {
                    GlobalLoadoutAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
                }
            }
        }

        if (victimDocs.length > 0) {
            try {
                await this.apiMQDelayPublisher.send(new ApiMQGlobalAggregateMessage(
                    MQAcceptedPatterns.GLOBAL_LOADOUT_AGGREGATE,
                    event.instance.instanceId,
                    victimDocs,
                    [{
                        world: event.instance.world,
                        loadout: event.characterLoadoutId,
                    }],
                ), event.instance.duration);

                // Total Bracket aggregation
                await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                    MQAcceptedPatterns.GLOBAL_LOADOUT_AGGREGATE,
                    event.instance.instanceId,
                    victimDocs,
                    [{
                        world: event.instance.world,
                        loadout: event.characterLoadoutId,
                    }],
                    Bracket.TOTAL,
                ));
            } catch (err) {
                if (err instanceof Error) {
                    GlobalLoadoutAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
                }
            }
        }

        return true;
    }
}
