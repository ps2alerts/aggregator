/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../ps2census/events/DeathEvent';
import {Injectable, Logger} from '@nestjs/common';
import FactionUtils from '../../../utils/FactionUtils';
import {Kill} from 'ps2census';
import {MqAcceptedPatterns} from '../../../ps2alerts-constants/mqAcceptedPatterns';
import ApiMQDelayPublisher from '../../../services/rabbitmq/publishers/ApiMQDelayPublisher';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import {Bracket} from '../../../ps2alerts-constants/bracket';
import ExceptionHandler from '../../system/ExceptionHandler';
import {format} from 'date-fns';

@Injectable()
export default class GlobalFactionCombatAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = new Logger('GlobalFactionCombatAggregate');

    constructor(
        private readonly apiMQPublisher: ApiMQPublisher,
        private readonly apiMQDelayPublisher: ApiMQDelayPublisher,
    ) {}

    public async handle(event: DeathEvent): Promise<boolean> {
        GlobalFactionCombatAggregate.logger.verbose('GlobalFactionCombatAggregate.handle');

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
            await this.apiMQDelayPublisher.send(new ApiMQGlobalAggregateMessage(
                MqAcceptedPatterns.GLOBAL_FACTION_COMBAT_AGGREGATE,
                event.instance.instanceId,
                documents,
                [{
                    world: event.instance.world,
                    date: format(new Date(), 'yyyy-MM-dd'),
                    ps2AlertsEventType: event.instance.ps2AlertsEventType,
                }],
            ), event.instance.duration);

            // Total bracket aggregation
            await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                MqAcceptedPatterns.GLOBAL_FACTION_COMBAT_AGGREGATE,
                event.instance.instanceId,
                documents,
                [{
                    world: event.instance.world,
                    date: format(new Date(), 'yyyy-MM-dd'),
                    ps2AlertsEventType: event.instance.ps2AlertsEventType,
                }],
                Bracket.TOTAL,
            ));
        } catch (err) {
            new ExceptionHandler('Could not publish message to API!', err, 'GlobalFactionCombatAggregate.handle');
        }

        return true;
    }
}
