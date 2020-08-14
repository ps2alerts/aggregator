import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import {InstancePlayerAggregateSchemaInterface} from '../../../models/aggregate/instance/InstancePlayerAggregateModel';
import {Kill} from 'ps2census/dist/client/events/Death';

@injectable()
export default class InstancePlayerAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('InstancePlayerAggregate');

    private readonly factory: MongooseModelFactory<InstancePlayerAggregateSchemaInterface>;

    constructor(@inject(TYPES.instancePlayerAggregateFactory) factory: MongooseModelFactory<InstancePlayerAggregateSchemaInterface>) {
        this.factory = factory;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        InstancePlayerAggregate.logger.debug('InstancePlayerAggregate.handle');

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
                    player: event.attackerCharacterId,
                },
                doc,
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                InstancePlayerAggregate.logger.error(`Updating InstancePlayerAggregate Attacker Error! ${err}`);
            });
        });

        victimDocs.forEach((doc) => {
            void this.factory.model.updateOne(
                {
                    instance: event.instance.instanceId,
                    player: event.characterId,
                },
                doc,
                {
                    upsert: true,
                },
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                InstancePlayerAggregate.logger.error(`Updating InstancePlayerAggregate Victim Error! ${err}`);
            });
        });

        return true;
    }
}
