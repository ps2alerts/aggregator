import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import ApplicationException from '../../../exceptions/ApplicationException';
import {AlertWeaponAggregateSchemaInterface} from '../../../models/aggregate/alert/AlertWeaponAggregateModel';

@injectable()
export default class AlertWeaponAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('AlertWeaponAggregate');

    private readonly factory: MongooseModelFactory<AlertWeaponAggregateSchemaInterface>;

    constructor(@inject(TYPES.alertWeaponAggregateFactory) factory: MongooseModelFactory<AlertWeaponAggregateSchemaInterface>) {
        this.factory = factory;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        AlertWeaponAggregate.logger.debug('AlertWeaponAggregate.handle');

        // Create initial record if doesn't exist
        if (!await this.factory.model.exists({
            alert: event.alert.alertId,
            weapon: event.attackerWeaponId,
        })) {
            await this.insertInitial(event);
        }

        const documents = [];

        if (!event.isTeamkill && !event.isSuicide) {
            documents.push({$inc: {kills: 1}});
        }

        if (event.isTeamkill) {
            documents.push({$inc: {teamKills: 1}});
        }

        if (event.isSuicide) {
            documents.push({$inc: {suicides: 1}});
        }

        if (event.isHeadshot) {
            documents.push({$inc: {headshots: 1}});
        }

        // It's an old promise sir, but it checks out (tried Async, doesn't work with forEach)
        documents.forEach((doc) => {
            void this.factory.model.updateOne(
                {
                    alert: event.alert.alertId,
                    weapon: event.attackerWeaponId,
                },
                doc,
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                AlertWeaponAggregate.logger.error(`Updating Aggregate Error! ${err}`);
            });
        });

        return true;
    }

    public async insertInitial(event: DeathEvent): Promise<boolean> {
        AlertWeaponAggregate.logger.debug('Adding Initial AlertWeaponAggregate Record');
        const data = {
            alert: event.alert.alertId,
            weapon: event.attackerWeaponId,
            kills: 0,
            teamKills: 0,
            suicides: 0,
            headshots: 0,
        };

        try {
            const row = await this.factory.saveDocument(data);
            AlertWeaponAggregate.logger.info(`Inserted initial AlertWeaponAggregate record for A: ${row.alert} | Wep: ${row.weapon}`);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to insert initial AlertWeaponAggregate record into DB! ${err}`, 'AlertWeaponAggregate');
        }
    }
}
