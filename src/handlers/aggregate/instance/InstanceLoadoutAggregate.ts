import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {Kill} from 'ps2census';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {MqAcceptedPatterns} from '../../../ps2alerts-constants/mqAcceptedPatterns';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import FactionUtils from '../../../utils/FactionUtils';

@injectable()
export default class InstanceLoadoutAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('InstanceLoadoutAggregate');

    constructor(@inject(TYPES.apiMQPublisher) private readonly apiMQPublisher: ApiMQPublisher) {}

    public async handle(event: DeathEvent): Promise<boolean> {
        InstanceLoadoutAggregate.logger.silly('InstanceLoadoutAggregate.handle');

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

        if (event.attackerCharacter && attackerDocs.length > 0) {
            try {
                await this.apiMQPublisher.send(new ApiMQMessage(
                    MqAcceptedPatterns.INSTANCE_LOADOUT_AGGREGATE,
                    attackerDocs,
                    [{
                        instance: event.instance.instanceId,
                        loadout: event.attackerLoadoutId,
                    }],
                ));
            } catch (err) {
                if (err instanceof Error) {
                    InstanceLoadoutAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
                }
            }
        }

        try {
            await this.apiMQPublisher.send(new ApiMQMessage(
                MqAcceptedPatterns.INSTANCE_LOADOUT_AGGREGATE,
                victimDocs,
                [{
                    instance: event.instance.instanceId,
                    loadout: event.characterLoadoutId,
                }],
            ));
        } catch (err) {
            if (err instanceof Error) {
                InstanceLoadoutAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
            }
        }

        return true;
    }
}
