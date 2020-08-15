import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import {InstanceWeaponAggregateSchemaInterface} from '../../../models/aggregate/instance/InstanceWeaponAggregateModel';
import {Kill} from 'ps2census/dist/client/events/Death';

@injectable()
export default class InstanceWeaponAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('InstanceWeaponAggregate');

    private readonly factory: MongooseModelFactory<InstanceWeaponAggregateSchemaInterface>;

    constructor(@inject(TYPES.instanceWeaponAggregateFactory) factory: MongooseModelFactory<InstanceWeaponAggregateSchemaInterface>) {
        this.factory = factory;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        InstanceWeaponAggregate.logger.debug('InstanceWeaponAggregate.handle');

        const documents = [];

        if (event.killType === Kill.Normal) {
            documents.push({$inc: {kills: 1}});
        }

        if (event.killType === Kill.TeamKill) {
            documents.push({$inc: {teamKills: 1}});
        }

        if (event.killType === Kill.Suicide || event.killType === Kill.RestrictedArea) {
            documents.push({$inc: {suicides: 1}});
        }

        if (event.isHeadshot) {
            documents.push({$inc: {headshots: 1}});
        }

        // It's an old promise sir, but it checks out (tried Async, doesn't work with forEach)
        documents.forEach((doc) => {
            void this.factory.model.updateOne(
                {
                    instance: event.instance.instanceId,
                    weapon: event.attackerWeaponId,
                },
                doc,
                {
                    upsert: true,
                },
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                InstanceWeaponAggregate.logger.error(`Updating InstanceWeaponAggregate Error! ${err}`);
            });
        });

        return true;
    }
}
