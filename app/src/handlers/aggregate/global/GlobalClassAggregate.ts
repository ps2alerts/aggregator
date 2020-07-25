import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import ApplicationException from '../../../exceptions/ApplicationException';
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {GlobalClassAggregateSchemaInterface} from '../../../models/aggregate/global/GlobalClassAggregateModel';

@injectable()
export default class GlobalClassAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('GlobalClassAggregate');

    private readonly factory: MongooseModelFactory<GlobalClassAggregateSchemaInterface>;

    constructor(@inject(TYPES.globalClassAggregateFactory) factory: MongooseModelFactory<GlobalClassAggregateSchemaInterface>) {
        this.factory = factory;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        GlobalClassAggregate.logger.debug('GlobalClassAggregate.handle');

        // Check both attacker and victim for existence
        const checks = [event.characterLoadoutId, event.attackerLoadoutId];

        for (const id of checks) {
            // Create initial record if doesn't exist
            if (!await this.factory.model.exists({
                class: event.characterLoadoutId,
                world: event.alert.world,
            })) {
                await this.insertInitial(event, id);
            }
        }

        const attackerDocs = [];
        const victimDocs = [];

        // Victim deaths always counted in every case
        victimDocs.push({$inc: {deaths: 1}});

        if (!event.isTeamkill && !event.isSuicide) {
            attackerDocs.push({$inc: {kills: 1}});
        }

        if (event.isTeamkill) {
            attackerDocs.push({$inc: {teamKills: 1}});
        }

        if (event.isSuicide) {
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
                    world: event.alert.world,
                },
                doc,
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                GlobalClassAggregate.logger.error(`Updating GlobalClassAggregate Attacker Error! ${err}`);
            });
        });

        victimDocs.forEach((doc) => {
            void this.factory.model.updateOne(
                {
                    class: event.characterLoadoutId,
                    world: event.alert.world,
                },
                doc,
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                GlobalClassAggregate.logger.error(`Updating GlobalClassAggregate Victim Error! ${err}`);
            });
        });

        return true;
    }

    private async insertInitial(event: DeathEvent, loadoutId: number): Promise<boolean> {
        GlobalClassAggregate.logger.debug(`Adding Initial GlobalClassAggregate Record for Loadout: ${loadoutId} | World: ${event.alert.world}`);

        const document = {
            class: loadoutId,
            world: event.alert.world,
            kills: 0,
            deaths: 0,
            teamKills: 0,
            suicides: 0,
            headshots: 0,
        };

        try {
            const row = await this.factory.saveDocument(document);
            GlobalClassAggregate.logger.info(`Inserted initial GlobalClassAggregate record for Loadout: ${row.class} | World: ${row.world}`);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to insert initial GlobalClassAggregate record into DB! ${err}`, 'GlobalClassAggregate');
        }
    }
}
