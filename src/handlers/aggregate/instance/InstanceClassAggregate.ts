import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import ApplicationException from '../../../exceptions/ApplicationException';
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {InstanceClassAggregateSchemaInterface} from '../../../models/aggregate/instance/InstanceClassAggregateModel';
import {Kill} from 'ps2census/dist/client/events/Death';

@injectable()
export default class InstanceClassAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('InstanceClassAggregate');

    private readonly factory: MongooseModelFactory<InstanceClassAggregateSchemaInterface>;

    constructor(@inject(TYPES.instanceClassAggregateFactory) factory: MongooseModelFactory<InstanceClassAggregateSchemaInterface>) {
        this.factory = factory;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        InstanceClassAggregate.logger.debug('InstanceClassAggregate.handle');

        // Check both attacker and victim for existence
        const checks = [event.characterLoadoutId, event.attackerLoadoutId];

        for (const id of checks) {
            // Create initial record if doesn't exist
            if (!await this.factory.model.exists({
                instance: event.instance.instanceId,
                class: id,
            })) {
                await this.insertInitial(event, id);
            }
        }

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

        if (event.killType === Kill.Suicide) {
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
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                InstanceClassAggregate.logger.error(`Updating InstanceClassAggregate Attacker Error! ${err}`);
            });
        });

        victimDocs.forEach((doc) => {
            void this.factory.model.updateOne(
                {
                    instance: event.instance.instanceId,
                    class: event.characterLoadoutId,
                },
                doc,
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                InstanceClassAggregate.logger.error(`Updating InstanceClassAggregate Victim Error! ${err}`);
            });
        });

        return true;
    }

    private async insertInitial(event: DeathEvent, loadoutId: number): Promise<boolean> {
        InstanceClassAggregate.logger.debug(`Adding Initial InstanceClassAggregate Record for Instance: ${event.instance.instanceId} | Loadout: ${loadoutId}`);

        const document = {
            instance: event.instance.instanceId,
            class: loadoutId,
            kills: 0,
            deaths: 0,
            teamKills: 0,
            suicides: 0,
            headshots: 0,
        };

        try {
            const row = await this.factory.model.create(document);
            InstanceClassAggregate.logger.debug(`Inserted initial InstanceClassAggregate record for Instance: ${row.instance} | Loadout: ${row.class}`);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const error: Error = err;

            if (!error.message.includes('E11000')) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`Unable to insert initial InstanceClassAggregate record into DB! ${err}`, 'InstanceClassAggregate');
            }
        }

        return false;
    }
}
