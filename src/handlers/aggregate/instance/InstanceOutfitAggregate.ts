import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import {InstanceOutfitAggregateSchemaInterface} from '../../../models/aggregate/instance/InstanceOutfitAggregateModel';
import {Kill} from 'ps2census/dist/client/events/Death';

@injectable()
export default class InstanceOutfitAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('InstanceOutfitAggregate');

    private readonly factory: MongooseModelFactory<InstanceOutfitAggregateSchemaInterface>;

    constructor(@inject(TYPES.instanceOutfitAggregateFactory) factory: MongooseModelFactory<InstanceOutfitAggregateSchemaInterface>) {
        this.factory = factory;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        InstanceOutfitAggregate.logger.silly('InstanceOutfitAggregate.handle');

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

        // Purpose for this is we can aggregate stats for "outfitless" characters, e.g. TR (-3) got X kills
        const attackerOutfitId = event.attackerCharacter.outfit ? event.attackerCharacter.outfit.id : `-${event.attackerCharacter.faction}`;
        const victimOutfitId = event.character.outfit ? event.character.outfit.id : `-${event.character.faction}`;

        // It's an old promise sir, but it checks out (tried Async, doesn't work with forEach)
        attackerDocs.forEach((doc) => {
            void this.factory.model.updateOne(
                {
                    outfit: attackerOutfitId,
                    instance: event.instance.instanceId,
                },
                doc,
                {
                    upsert: true,
                },
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                InstanceOutfitAggregate.logger.error(`Updating InstanceOutfitAggregate Attacker Error! ${err}`);
            });
        });

        victimDocs.forEach((doc) => {
            void this.factory.model.updateOne(
                {
                    outfit: victimOutfitId,
                    instance: event.instance.instanceId,
                },
                doc,
                {
                    upsert: true,
                },
            ).catch((err: Error) => {
                if (!err.message.includes('E11000')) {
                    InstanceOutfitAggregate.logger.error(`Updating InstanceOutfitAggregate Victim Error! ${err.message}`);
                }
            });
        });

        return true;
    }
}
