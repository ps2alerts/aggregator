import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger, getLogsEnabled} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import {InstancePlayerAggregateSchemaInterface} from '../../../models/aggregate/instance/InstancePlayerAggregateModel';
import ApplicationException from '../../../exceptions/ApplicationException';

@injectable()
export default class InstancePlayerAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('InstancePlayerAggregate');

    private static readonly LOGSENABLED = getLogsEnabled().aggregates.instance.player;

    private readonly factory: MongooseModelFactory<InstancePlayerAggregateSchemaInterface>;

    constructor(@inject(TYPES.instancePlayerAggregateFactory) factory: MongooseModelFactory<InstancePlayerAggregateSchemaInterface>) {
        this.factory = factory;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        InstancePlayerAggregate.logger.debug('InstancePlayerAggregate.handle');

        // Check both attacker and victim for existence
        const checks = [event.characterId, event.attackerCharacterId];

        for (const id of checks) {
            // Create initial record if doesn't exist
            if (!await this.factory.model.exists({
                instance: event.instance.instanceId,
                player: id,
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
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                InstancePlayerAggregate.logger.error(`Updating InstancePlayerAggregate Victim Error! ${err}`);
            });
        });

        return true;
    }

    private async insertInitial(event: DeathEvent, characterId: string): Promise<boolean> {
        if (InstancePlayerAggregate.LOGSENABLED) {
            InstancePlayerAggregate.logger.info(`Adding initial InstancePlayerAggregate record for Instance: ${event.instance.instanceId} | Player: ${characterId}`);
        }

        const player = {
            instance: event.instance.instanceId,
            player: characterId,
            kills: 0,
            deaths: 0,
            teamKills: 0,
            suicides: 0,
            headshots: 0,
        };

        try {
            const row = await this.factory.saveDocument(player);

            if (InstancePlayerAggregate.LOGSENABLED) {
                InstancePlayerAggregate.logger.info(`Inserted initial InstancePlayerAggregate record for Instance: ${row.instance} | Player: ${row.player}`);
            }

            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to insert initial InstancePlayerAggregate record into DB! ${err}`, 'InstancePlayerAggregate');
        }
    }
}
