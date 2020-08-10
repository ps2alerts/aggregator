import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import ApplicationException from '../../../exceptions/ApplicationException';
import {GlobalWeaponAggregateSchemaInterface} from '../../../models/aggregate/global/GlobalWeaponAggregateModel';
import {Kill} from 'ps2census/dist/client/events/Death';

@injectable()
export default class GlobalWeaponAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('GlobalWeaponAggregate');

    private readonly factory: MongooseModelFactory<GlobalWeaponAggregateSchemaInterface>;

    constructor(@inject(TYPES.globalWeaponAggregateFactory) factory: MongooseModelFactory<GlobalWeaponAggregateSchemaInterface>) {
        this.factory = factory;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        GlobalWeaponAggregate.logger.debug('GlobalWeaponAggregate.handle');

        // Create initial record if doesn't exist
        if (!await this.factory.model.exists({
            weapon: event.attackerWeaponId,
            world: event.instance.world,
        })) {
            await this.insertInitial(event);
        }

        const documents = [];

        if (event.killType === Kill.Normal) {
            documents.push({$inc: {kills: 1}});
        }

        if (event.killType === Kill.TeamKill) {
            documents.push({$inc: {teamKills: 1}});
        }

        if (event.killType === Kill.Suicide) {
            documents.push({$inc: {suicides: 1}});
        }

        if (event.isHeadshot) {
            documents.push({$inc: {headshots: 1}});
        }

        // It's an old promise sir, but it checks out (tried Async, doesn't work with forEach)
        documents.forEach((doc) => {
            void this.factory.model.updateOne(
                {
                    weapon: event.attackerWeaponId,
                    world: event.instance.world,
                },
                doc,
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                GlobalWeaponAggregate.logger.error(`Updating Aggregate Error! ${err}`);
            });
        });

        return true;
    }

    public async insertInitial(event: DeathEvent): Promise<boolean> {
        GlobalWeaponAggregate.logger.debug('Adding Initial GlobalWeaponAggregate Record');
        const data = {
            weapon: event.attackerWeaponId,
            world: event.instance.world,
            kills: 0,
            teamKills: 0,
            suicides: 0,
            headshots: 0,
        };

        try {
            const row = await this.factory.model.create(data);
            GlobalWeaponAggregate.logger.debug(`Inserted initial GlobalWeaponAggregate record for Weapon: ${row.weapon} | World: ${row.world}`);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const error: Error = err;

            if (!error.message.includes('E11000')) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`Unable to insert initial GlobalWeaponAggregate record into DB! ${err}`, 'GlobalWeaponAggregate');
            }
        }

        return false;
    }
}
