import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {GlobalClassAggregateSchemaInterface} from '../../../models/aggregate/global/GlobalClassAggregateModel';
import {Kill} from 'ps2census/dist/client/events/Death';

@injectable()
export default class GlobalClassAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('GlobalClassAggregate');

    private readonly factory: MongooseModelFactory<GlobalClassAggregateSchemaInterface>;

    constructor(@inject(TYPES.globalClassAggregateFactory) factory: MongooseModelFactory<GlobalClassAggregateSchemaInterface>) {
        this.factory = factory;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        GlobalClassAggregate.logger.debug('GlobalClassAggregate.handle');

        const attackerDocs = [];
        const victimDocs = [];

        // Victim deaths always counted in every case
        victimDocs.push({$inc: {deaths: 1}});

        if (event.killType === Kill.Normal) {
            attackerDocs.push({$inc: {kills: 1}});
        }

        if (event.killType === Kill.TeamKill) {
            attackerDocs.push({$inc: {teamKills: 1}});
        }

        if (event.killType === Kill.Suicide || event.killType === Kill.RestrictedArea) {
            // Attacker and victim are the same here, so it doesn't matter which
            victimDocs.push({$inc: {suicides: 1}});
        }

        if (event.isHeadshot) {
            attackerDocs.push({$inc: {headshots: 1}});
        }

        // It's an old promise sir, but it checks out (tried Async, doesn't work with forEach)
        attackerDocs.forEach((doc) => {
            void this.factory.model.updateOne(
                {
                    class: event.attackerLoadoutId,
                    world: event.instance.world,
                },
                doc,
                {
                    upsert: true,
                },
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                GlobalClassAggregate.logger.error(`Updating GlobalClassAggregate Attacker Error! ${err}`);
            });
        });

        victimDocs.forEach((doc) => {
            void this.factory.model.updateOne(
                {
                    class: event.characterLoadoutId,
                    world: event.instance.world,
                },
                doc,
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                GlobalClassAggregate.logger.error(`Updating GlobalClassAggregate Victim Error! ${err}`);
            });
        });

        return true;
    }
}
