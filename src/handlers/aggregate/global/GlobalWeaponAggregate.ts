import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
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
                {
                    upsert: true,
                },
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                GlobalWeaponAggregate.logger.error(`Updating Aggregate Error! ${err}`);
            });
        });

        return true;
    }
}
