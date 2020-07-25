import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import ApplicationException from '../../../exceptions/ApplicationException';
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {AlertClassAggregateSchemaInterface} from '../../../models/aggregate/alert/AlertClassAggregateModel';

@injectable()
export default class AlertClassAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('AlertClassAggregate');

    private readonly factory: MongooseModelFactory<AlertClassAggregateSchemaInterface>;

    constructor(@inject(TYPES.alertClassAggregateFactory) factory: MongooseModelFactory<AlertClassAggregateSchemaInterface>) {
        this.factory = factory;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        AlertClassAggregate.logger.debug('AlertClassAggregate.handle');

        // Check both attacker and victim for existence
        const checks = [event.characterLoadoutId, event.attackerLoadoutId];

        for (const id of checks) {
            // Create initial record if doesn't exist
            if (!await this.factory.model.exists({
                alert: event.alert.alertId,
                class: id,
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
                    class: event.attackerLoadoutId,
                },
                doc,
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                AlertClassAggregate.logger.error(`Updating AlertClassAggregate Attacker Error! ${err}`);
            });
        });

        victimDocs.forEach((doc) => {
            void this.factory.model.updateOne(
                {
                    alert: event.alert.alertId,
                    class: event.characterLoadoutId,
                },
                doc,
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                AlertClassAggregate.logger.error(`Updating AlertClassAggregate Victim Error! ${err}`);
            });
        });

        return true;
    }

    private async insertInitial(event: DeathEvent, loadoutId: number): Promise<boolean> {
        AlertClassAggregate.logger.debug(`Adding Initial AlertClassAggregate Record for Alert: ${event.alert.alertId} | Loadout: ${loadoutId}`);

        const document = {
            alert: event.alert.alertId,
            class: loadoutId,
            kills: 0,
            deaths: 0,
            teamKills: 0,
            suicides: 0,
            headshots: 0,
        };

        try {
            const row = await this.factory.saveDocument(document);
            AlertClassAggregate.logger.info(`Inserted initial AlertClassAggregate record for Alert: ${row.alert} | Loadout: ${row.class}`);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to insert initial AlertClassAggregate record into DB! ${err}`, 'AlertClassAggregate');
        }
    }
}
