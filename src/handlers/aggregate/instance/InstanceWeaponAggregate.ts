/* eslint-disable @typescript-eslint/naming-convention */
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import {Kill} from 'ps2census';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {MqAcceptedPatterns} from '../../../ps2alerts-constants/mqAcceptedPatterns';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import FactionUtils from '../../../utils/FactionUtils';

@injectable()
export default class InstanceWeaponAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('InstanceWeaponAggregate');

    constructor(@inject(TYPES.apiMQPublisher) private readonly apiMQPublisher: ApiMQPublisher) {}

    public async handle(event: DeathEvent): Promise<boolean> {
        InstanceWeaponAggregate.logger.silly('InstanceWeaponAggregate.handle');

        const attackerFactionShort = FactionUtils.parseFactionIdToShortName(event.attackerCharacter.faction);
        const victimFactionShort = FactionUtils.parseFactionIdToShortName(event.character.faction);

        const documents = [];

        documents.push({$setOnInsert: {
            weapon: event.attackerWeapon,
        }});

        if (event.killType === Kill.Normal || event.killType === Kill.Undetermined) {
            documents.push({$inc: {kills: 1}});
        }

        if (event.killType === Kill.TeamKill) {
            documents.push({$inc: {teamKills: 1}});
        }

        if (event.killType === Kill.Suicide || event.killType === Kill.RestrictedArea) {
            documents.push({$inc: {suicides: 1}});
        }

        if (event.isHeadshot && event.killType !== Kill.TeamKill) {
            documents.push({$inc: {headshots: 1}});
        }

        // Faction vs Faction
        if (event.attackerCharacter.faction !== event.character.faction) {
            const factionKey = `factionKills.${attackerFactionShort}.${victimFactionShort}`;
            documents.push({$inc: {[factionKey]: 1}});
        }

        try {
            await this.apiMQPublisher.send(new ApiMQMessage(
                MqAcceptedPatterns.INSTANCE_WEAPON_AGGREGATE,
                documents,
                [{
                    instance: event.instance.instanceId,
                    'weapon.id': event.attackerWeapon.id,
                }],
            ));
        } catch (err) {
            if (err instanceof Error) {
                InstanceWeaponAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
            }
        }

        return true;
    }
}
