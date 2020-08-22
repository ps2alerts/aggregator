import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import {GlobalCharacterAggregateSchemaInterface} from '../../../models/aggregate/global/GlobalCharacterAggregateModel';
import {Kill} from 'ps2census/dist/client/events/Death';

@injectable()
export default class GlobalCharacterAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('GlobalCharacterAggregate');

    private readonly factory: MongooseModelFactory<GlobalCharacterAggregateSchemaInterface>;

    constructor(@inject(TYPES.globalCharacterAggregateFactory) factory: MongooseModelFactory<GlobalCharacterAggregateSchemaInterface>) {
        this.factory = factory;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        GlobalCharacterAggregate.logger.debug('GlobalCharacterAggregate.handle');

        const attackerDocs = [];
        const victimDocs = [];

        attackerDocs.push({$setOnInsert: {
            world: event.character.world,
        }});
        victimDocs.push({$setOnInsert: {
            world: event.character.world,
        }});

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
            if (event.attackerCharacter) {
                void this.factory.model.updateOne(
                    {character: event.attackerCharacter.id},
                    doc,
                    {
                        upsert: true,
                    },
                ).catch((err: Error) => {
                    if (!err.message.includes('E11000')) {
                        GlobalCharacterAggregate.logger.error(`Updating GlobalCharacterAggregate Attacker Error! ${err.message}`);
                    }
                });
            }
        });

        victimDocs.forEach((doc) => {
            void this.factory.model.updateOne(
                {character: event.character.id},
                doc,
                {
                    upsert: true,
                },
            ).catch((err: Error) => {
                if (!err.message.includes('E11000')) {
                    GlobalCharacterAggregate.logger.error(`Updating GlobalCharacterAggregate Victim Error! ${err.message}`);
                }
            });
        });

        return true;
    }
}
