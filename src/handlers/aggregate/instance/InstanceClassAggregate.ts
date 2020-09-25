import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {InstanceClassAggregateSchemaInterface} from '../../../models/aggregate/instance/InstanceClassAggregateModel';
import {Kill} from 'ps2census';

@injectable()
export default class InstanceClassAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('InstanceClassAggregate');
    private readonly factory: MongooseModelFactory<InstanceClassAggregateSchemaInterface>;

    constructor(@inject(TYPES.instanceClassAggregateFactory) factory: MongooseModelFactory<InstanceClassAggregateSchemaInterface>) {
        this.factory = factory;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        InstanceClassAggregate.logger.silly('InstanceClassAggregate.handle');

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
                    instance: event.instance.instanceId,
                    class: event.attackerLoadoutId,
                },
                doc,
                {
                    upsert: true,
                },
            ).catch((err: Error) => {
                if (!err.message.includes('E11000')) {
                    InstanceClassAggregate.logger.error(`Updating InstanceClassAggregate Attacker Error! ${err.message}`);
                }
            });
        });

        victimDocs.forEach((doc) => {
            void this.factory.model.updateOne(
                {
                    instance: event.instance.instanceId,
                    class: event.characterLoadoutId,
                },
                doc,
                {
                    upsert: true,
                },
            ).catch((err: Error) => {
                if (!err.message.includes('E11000')) {
                    InstanceClassAggregate.logger.error(`Updating InstanceClassAggregate Victim Error! ${err.message}`);
                }
            });
        });

        return true;
    }
}
