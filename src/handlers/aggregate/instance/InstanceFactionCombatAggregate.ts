import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import {InstanceFactionCombatAggregateSchemaInterface} from '../../../models/aggregate/instance/InstanceFactionCombatAggregateModel';
import FactionUtils from '../../../utils/FactionUtils';
import {Kill} from 'ps2census/dist/client/events/Death';

@injectable()
export default class InstanceFactionCombatAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('InstanceFactionCombatAggregate');

    private readonly factory: MongooseModelFactory<InstanceFactionCombatAggregateSchemaInterface>;

    constructor(@inject(TYPES.instanceFactionCombatAggregateFactory) factory: MongooseModelFactory<InstanceFactionCombatAggregateSchemaInterface>) {
        this.factory = factory;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        InstanceFactionCombatAggregate.logger.debug('InstanceFactionCombatAggregate.handle');

        const documents = [];

        // Increment attacker faction kills
        if (event.killType === Kill.Normal) {
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

        if (event.killType === Kill.TeamKill) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const teamKillKey = `${FactionUtils.parseFactionIdToShortName(event.attackerCharacter.faction)}.teamKills`;
            documents.push(
                {$inc: {[teamKillKey]: 1}},
                {$inc: {['totals.teamKills']: 1}},
            );
        }

        if (event.killType === Kill.Suicide) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const suicideKey = `${FactionUtils.parseFactionIdToShortName(event.character.faction)}.suicides`;
            documents.push(
                {$inc: {[suicideKey]: 1}},
                {$inc: {['totals.suicides']: 1}},
            );
        }

        if (event.isHeadshot) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const attackerHeadshotKey = `${FactionUtils.parseFactionIdToShortName(event.attackerCharacter.faction)}.headshots`;
            documents.push(
                {$inc: {[attackerHeadshotKey]: 1}},
                {$inc: {['totals.headshots']: 1}},
            );
        }

        // It's an old promise sir, but it checks out (tried Async, doesn't work with forEach)
        documents.forEach((doc) => {
            void this.factory.model.updateOne(
                {instance: event.instance.instanceId},
                doc,
                {
                    upsert: true,
                },
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                InstanceFactionCombatAggregate.logger.error(`Updating InstanceFactionCombatAggregate Error! ${err}`);
            });
        });

        return true;
    }
}
