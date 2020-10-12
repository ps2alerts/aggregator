import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import FactionUtils from '../../../utils/FactionUtils';
import {Kill} from 'ps2census';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {MQAcceptedPatterns} from '../../../constants/MQAcceptedPatterns';

@injectable()
export default class GlobalFactionCombatAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('GlobalFactionCombatAggregate');
    private readonly apiMQPublisher: ApiMQPublisher;

    constructor(@inject(TYPES.apiMQPublisher) apiMQPublisher: ApiMQPublisher) {
        this.apiMQPublisher = apiMQPublisher;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        GlobalFactionCombatAggregate.logger.silly('GlobalFactionCombatAggregate.handle');

        const documents = [];

        // Increment attacker faction kills
        if (event.killType === Kill.Normal && event.attackerCharacter) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const attackerKillKey = `${FactionUtils.parseFactionIdToShortName(event.attackerCharacter.faction)}.kills`;
            documents.push(
                {$inc: {[attackerKillKey]: 1}},
                {$inc: {['totals.kills']: 1}},
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
        const victimDeathKey = `${FactionUtils.parseFactionIdToShortName(event.character.faction)}.deaths`;
        documents.push(
            {$inc: {[victimDeathKey]: 1}},
            {$inc: {['totals.deaths']: 1}},
        );

        if (event.killType === Kill.TeamKill && event.attackerCharacter) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const teamKillKey = `${FactionUtils.parseFactionIdToShortName(event.attackerCharacter.faction)}.teamKills`;
            documents.push(
                {$inc: {[teamKillKey]: 1}},
                {$inc: {['totals.teamKills']: 1}},
            );
        }

        if (event.killType === Kill.Suicide || event.killType === Kill.RestrictedArea) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const suicideKey = `${FactionUtils.parseFactionIdToShortName(event.character.faction)}.suicides`;
            documents.push(
                {$inc: {[suicideKey]: 1}},
                {$inc: {['totals.suicides']: 1}},
            );
        }

        if (event.isHeadshot && event.attackerCharacter) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const attackerHeadshotKey = `${FactionUtils.parseFactionIdToShortName(event.attackerCharacter.faction)}.headshots`;
            documents.push(
                {$inc: {[attackerHeadshotKey]: 1}},
                {$inc: {['totals.headshots']: 1}},
            );
        }

        try {
            await this.apiMQPublisher.send(new ApiMQMessage(
                MQAcceptedPatterns.GLOBAL_FACTION_COMBAT_AGGREGATE,
                documents,
                [{world: event.instance.world}],
            ));
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            GlobalFactionCombatAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
        }

        return true;
    }
}
