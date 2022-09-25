/* eslint-disable @typescript-eslint/naming-convention,@typescript-eslint/no-unsafe-assignment */
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../ps2census/events/DeathEvent';
import {Injectable, Logger} from '@nestjs/common';
import {Kill} from 'ps2census';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {MqAcceptedPatterns} from '../../../ps2alerts-constants/mqAcceptedPatterns';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import FactionUtils from '../../../utils/FactionUtils';
import ExceptionHandler from '../../system/ExceptionHandler';

@Injectable()
export default class InstanceWeaponAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = new Logger('InstanceWeaponAggregate');

    constructor(private readonly apiMQPublisher: ApiMQPublisher) {}

    public async handle(event: DeathEvent): Promise<boolean> {
        InstanceWeaponAggregate.logger.verbose('InstanceWeaponAggregate.handle');

        const attackerFactionShort = FactionUtils.parseFactionIdToShortName(event.attackerTeamId);
        const victimFactionShort = FactionUtils.parseFactionIdToShortName(event.teamId);

        const documents = [];

        documents.push({$setOnInsert: {
            weapon: event.attackerWeapon,
            ps2AlertsEventType: event.instance.ps2AlertsEventType,
        }});

        if (event.killType === Kill.Normal) {
            documents.push({$inc: {kills: 1}});

            const factionKey = `factionKills.${attackerFactionShort}.${victimFactionShort}`;
            documents.push({$inc: {[factionKey]: 1}});
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

        try {
            await this.apiMQPublisher.send(new ApiMQMessage(
                MqAcceptedPatterns.INSTANCE_WEAPON_AGGREGATE,
                documents,
                [{
                    instance: event.instance.instanceId,
                    'weapon.id': event.attackerWeapon.id,
                    ps2AlertsEventType: event.instance.ps2AlertsEventType,
                }],
            ));
        } catch (err) {
            new ExceptionHandler('Could not publish message to API!', err, 'InstanceWeaponAggregate.handle');
        }

        return true;
    }
}
