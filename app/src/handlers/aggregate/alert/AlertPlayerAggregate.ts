import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import {AlertPlayerAggregateSchemaInterface} from '../../../models/aggregate/alert/AlertPlayerAggregateModel';
import ApplicationException from '../../../exceptions/ApplicationException';

@injectable()
export default class AlertPlayerAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('AlertPlayerAggregate');

    private readonly factory: MongooseModelFactory<AlertPlayerAggregateSchemaInterface>;

    constructor(@inject(TYPES.alertPlayerAggregateFactory) factory: MongooseModelFactory<AlertPlayerAggregateSchemaInterface>) {
        this.factory = factory;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        AlertPlayerAggregate.logger.debug('AlertPlayerAggregate.handle');

        // Check both attacker and victim for existence
        const checks = [event.characterId, event.attackerCharacterId];

        for (const id of checks) {
            // Create initial record if doesn't exist
            if (!await this.factory.model.exists({
                alert: event.alert.alertId,
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
                    alert: event.alert.alertId,
                    player: event.attackerCharacterId,
                },
                doc,
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                AlertPlayerAggregate.logger.error(`Updating AlertPlayerAggregate Attacker Error! ${err}`);
            });
        });

        victimDocs.forEach((doc) => {
            void this.factory.model.updateOne(
                {
                    alert: event.alert.alertId,
                    player: event.characterId,
                },
                doc,
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                AlertPlayerAggregate.logger.error(`Updating AlertPlayerAggregate Victim Error! ${err}`);
            });
        });

        return true;
    }

    private async insertInitial(event: DeathEvent, characterId: string): Promise<boolean> {
        AlertPlayerAggregate.logger.debug(`Adding Initial AlertPlayerAggregate Record for Alert: ${event.alert.alertId} | Player: ${characterId}`);

        const player = {
            alert: event.alert.alertId,
            player: characterId,
            kills: 0,
            deaths: 0,
            teamKills: 0,
            suicides: 0,
            headshots: 0,
        };

        try {
            const row = await this.factory.saveDocument(player);
            AlertPlayerAggregate.logger.debug(`Inserted initial AlertPlayerAggregate record for Alert: ${row.alert} | Player: ${row.player}`);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to insert initial AlertPlayerAggregate record into DB! ${err}`, 'AlertPlayerAggregate');
        }
    }
}
