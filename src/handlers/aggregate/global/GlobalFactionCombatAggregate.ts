import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import FactionUtils from '../../../utils/FactionUtils';
import {Kill} from 'ps2census';
import {MQAcceptedPatterns} from '../../../constants/MQAcceptedPatterns';
import ApiMQDelayPublisher from '../../../services/rabbitmq/publishers/ApiMQDelayPublisher';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import {calculateRemainingTime} from '../../../utils/InstanceRemainingTime';

@injectable()
export default class GlobalFactionCombatAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('GlobalFactionCombatAggregate');
    private readonly apiMQPublisher: ApiMQDelayPublisher;

    constructor(@inject(TYPES.apiMQDelayPublisher) apiMQPublisher: ApiMQDelayPublisher) {
        this.apiMQPublisher = apiMQPublisher;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        GlobalFactionCombatAggregate.logger.silly('GlobalFactionCombatAggregate.handle');

        const documents = [];

        if (event.attackerCharacter) {
            // Increment attacker faction kills

            // NSO handling
            if (event.killType === Kill.Undetermined) {
                if (event.character.faction === event.attackerCharacter.faction) {
                    const attackerKillKey = `${FactionUtils.parseFactionIdToShortName(event.attackerCharacter.faction)}.teamKills`;
                    documents.push(
                        {$inc: {[attackerKillKey]: 1}},
                        {$inc: {['totals.teamKills']: 1}},
                    );
                } else {
                    const attackerKillKey = `${FactionUtils.parseFactionIdToShortName(event.attackerCharacter.faction)}.kills`;
                    documents.push(
                        {$inc: {[attackerKillKey]: 1}},
                        {$inc: {['totals.kills']: 1}},
                    );
                }
            }

            if (event.killType === Kill.Normal) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
                const attackerKillKey = `${FactionUtils.parseFactionIdToShortName(event.attackerCharacter.faction)}.kills`;
                documents.push(
                    {$inc: {[attackerKillKey]: 1}},
                    {$inc: {['totals.kills']: 1}},
                );
            }

            if (event.killType === Kill.TeamKill) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
                const teamKillKey = `${FactionUtils.parseFactionIdToShortName(event.attackerCharacter.faction)}.teamKills`;
                documents.push(
                    {$inc: {[teamKillKey]: 1}},
                    {$inc: {['totals.teamKills']: 1}},
                );
            }

            if (event.isHeadshot && event.killType !== Kill.TeamKill) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
                const attackerHeadshotKey = `${FactionUtils.parseFactionIdToShortName(event.attackerCharacter.faction)}.headshots`;
                documents.push(
                    {$inc: {[attackerHeadshotKey]: 1}},
                    {$inc: {['totals.headshots']: 1}},
                );
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
        const victimDeathKey = `${FactionUtils.parseFactionIdToShortName(event.character.faction)}.deaths`;
        documents.push(
            {$inc: {[victimDeathKey]: 1}},
            {$inc: {['totals.deaths']: 1}},
        );

        if (event.killType === Kill.Suicide || event.killType === Kill.RestrictedArea) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const suicideKey = `${FactionUtils.parseFactionIdToShortName(event.character.faction)}.suicides`;
            documents.push(
                {$inc: {[suicideKey]: 1}},
                {$inc: {['totals.suicides']: 1}},
            );
        }

        try {
            await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                MQAcceptedPatterns.GLOBAL_FACTION_COMBAT_AGGREGATE,
                event.instance.instanceId,
                documents,
                [{world: event.instance.world}],
            ), calculateRemainingTime(event.instance) + 30000);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            GlobalFactionCombatAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
        }

        return true;
    }
}
