/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../ps2census/events/DeathEvent';
import {Injectable, Logger} from '@nestjs/common';
import FactionUtils from '../../../utils/FactionUtils';
import {Kill} from 'ps2census';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {MqAcceptedPatterns} from '../../../ps2alerts-constants/mqAcceptedPatterns';
import ApiMQPublisher from '../../../modules/rabbitmq/publishers/ApiMQPublisher';
import ExceptionHandler from '../../system/ExceptionHandler';

@Injectable()
export default class InstanceFactionCombatAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = new Logger('InstanceFactionCombatAggregate');

    constructor(private readonly apiMQPublisher: ApiMQPublisher) {}

    public async handle(event: DeathEvent): Promise<boolean> {
        InstanceFactionCombatAggregate.logger.verbose('InstanceFactionCombatAggregate.handle');

        const attackerFactionShort = FactionUtils.parseFactionIdToShortName(event.attackerTeamId);
        const victimFactionShort = FactionUtils.parseFactionIdToShortName(event.teamId);

        const documents = [];

        if (event.attackerCharacter) {
            // Increment attacker faction kills

            if (event.killType === Kill.Normal) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
                const attackerKillKey = `${attackerFactionShort}.kills`;
                documents.push(
                    {$inc: {[attackerKillKey]: 1}},
                    {$inc: {['totals.kills']: 1}},
                );

                const factionKey = `factionKills.${attackerFactionShort}.${victimFactionShort}`;
                documents.push({$inc: {[factionKey]: 1}});
            }

            if (event.killType === Kill.TeamKill) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
                const teamKillKey = `${attackerFactionShort}.teamKills`;
                documents.push(
                    {$inc: {[teamKillKey]: 1}},
                    {$inc: {['totals.teamKills']: 1}},
                );
            }

            if (event.isHeadshot && event.killType !== Kill.TeamKill) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
                const attackerHeadshotKey = `${attackerFactionShort}.headshots`;
                documents.push(
                    {$inc: {[attackerHeadshotKey]: 1}},
                    {$inc: {['totals.headshots']: 1}},
                );
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
        const victimDeathKey = `${victimFactionShort}.deaths`;
        documents.push(
            {$inc: {[victimDeathKey]: 1}},
            {$inc: {['totals.deaths']: 1}},
        );

        if (event.killType === Kill.Suicide || event.killType === Kill.RestrictedArea) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const suicideKey = `${victimFactionShort}.suicides`;
            documents.push(
                {$inc: {[suicideKey]: 1}},
                {$inc: {['totals.suicides']: 1}},
            );
        }

        try {
            await this.apiMQPublisher.send(new ApiMQMessage(
                MqAcceptedPatterns.INSTANCE_FACTION_COMBAT_AGGREGATE,
                documents,
                [{
                    instance: event.instance.instanceId,
                    ps2AlertsEventType: event.instance.ps2AlertsEventType,
                }],
            ));
        } catch (err) {
            new ExceptionHandler('Could not publish message to API!', err, 'InstanceFactionCombatAggregate.handle');
        }

        return true;
    }
}
