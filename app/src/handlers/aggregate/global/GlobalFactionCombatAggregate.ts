import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import {GlobalFactionCombatAggregateSchemaInterface} from '../../../models/aggregate/global/GlobalFactionCombatAggregateModel';
import ApplicationException from '../../../exceptions/ApplicationException';
import _ from 'lodash';
import FactionUtils from '../../../utils/FactionUtils';

@injectable()
export default class GlobalFactionCombatAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('GlobalFactionCombatAggregate');

    private readonly factory: MongooseModelFactory<GlobalFactionCombatAggregateSchemaInterface>;

    constructor(@inject(TYPES.globalFactionCombatAggregateFactory) factory: MongooseModelFactory<GlobalFactionCombatAggregateSchemaInterface>) {
        this.factory = factory;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        GlobalFactionCombatAggregate.logger.debug('GlobalFactionCombatAggregate.handle');

        // Create initial record if doesn't exist
        if (!await this.factory.model.exists({
            world: event.instance.world,
        })) {
            await this.insertInitial(event);
        }

        const documents = [];

        // Increment attacker faction kills
        if (!event.isTeamkill && !event.isSuicide) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const attackerKillKey = `${FactionUtils.parseFactionIdToShortName(event.attackerFaction)}.kills`;
            documents.push(
                {$inc: {[attackerKillKey]: 1}},
                {$inc: {['totals.kills']: 1}},
            );
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
        const victimDeathKey = `${FactionUtils.parseFactionIdToShortName(event.characterFaction)}.deaths`;
        documents.push(
            {$inc: {[victimDeathKey]: 1}},
            {$inc: {['totals.deaths']: 1}},
        );

        if (event.isTeamkill) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const teamKillKey = `${FactionUtils.parseFactionIdToShortName(event.attackerFaction)}.teamKills`;
            documents.push(
                {$inc: {[teamKillKey]: 1}},
                {$inc: {['totals.teamKills']: 1}},
            );
        }

        if (event.isSuicide) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const suicideKey = `${FactionUtils.parseFactionIdToShortName(event.characterFaction)}.suicides`;
            documents.push(
                {$inc: {[suicideKey]: 1}},
                {$inc: {['totals.suicides']: 1}},
            );
        }

        if (event.isHeadshot) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const attackerHeadshotKey = `${FactionUtils.parseFactionIdToShortName(event.attackerFaction)}.headshots`;
            documents.push(
                {$inc: {[attackerHeadshotKey]: 1}},
                {$inc: {['totals.headshots']: 1}},
            );
        }

        // It's an old promise sir, but it checks out (tried Async, doesn't work with forEach)
        documents.forEach((doc) => {
            void this.factory.model.updateOne(
                {world: event.instance.world},
                doc,
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                GlobalFactionCombatAggregate.logger.error(`Updating GlobalFactionCombatAggregate Error! ${err}`);
            });
        });

        return true;
    }

    public async insertInitial(event: DeathEvent): Promise<boolean> {
        GlobalFactionCombatAggregate.logger.debug('Adding Initial GlobalFactionCombatAggregate Record');
        const factionKeys = ['vs', 'nc', 'tr', 'nso', 'totals'];
        const data = {
            world: event.instance.world,
        };

        factionKeys.forEach((i) => {
            _.mergeWith(
                data,
                {
                    [i]: {
                        kills: 0,
                        deaths: 0,
                        teamKills: 0,
                        suicides: 0,
                        headshots: 0,
                    },
                },
            );
        });

        try {
            const row = await this.factory.saveDocument(data);
            GlobalFactionCombatAggregate.logger.debug(`Inserted initial GlobalFactionCombatAggregate record for World: ${row.world}`);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to insert initial GlobalFactionCombatAggregate record into DB! ${err}`, 'GlobalFactionCombatAggregate');
        }
    }
}
