import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import ApplicationException from '../../../exceptions/ApplicationException';
import _ from 'lodash';
import FacilityControlEvent from '../../census/events/FacilityControlEvent';
import {AlertFacilityControlAggregateInterface} from '../../../models/aggregate/AlertFacilityControlAggregateModel';
import FactionUtils from '../../../utils/FactionUtils';

@injectable()
export default class AlertFacilityControlAggregate implements AggregateHandlerInterface<FacilityControlEvent> {
    private static readonly logger = getLogger('AlertFacilityControlAggregate');

    private readonly factory: MongooseModelFactory<AlertFacilityControlAggregateInterface>;

    constructor(@inject(TYPES.alertFacilityControlAggregateFactory) factory: MongooseModelFactory<AlertFacilityControlAggregateInterface>) {
        this.factory = factory;
    }

    public async handle(event: FacilityControlEvent): Promise<boolean> {
        AlertFacilityControlAggregate.logger.debug('AlertFacilityControlAggregate.handle');

        // Create initial record if doesn't exist
        if (!await this.factory.model.exists({
            alert: event.alert.alertId,
            facility: event.facility,
        })) {
            await this.insertInitial(event);
        }

        const documents = [];

        if (event.isDefence) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const defenceKey = `${FactionUtils.parseFactionIdToShortName(event.newFaction)}.defences`;
            documents.push(
                {$inc: {[defenceKey]: 1}},
                {$inc: {['totals.defences']: 1}},
            );
        }

        if (!event.isDefence) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const captureKey = `${FactionUtils.parseFactionIdToShortName(event.newFaction)}.captures`;
            documents.push(
                {$inc: {[captureKey]: 1}},
                {$inc: {['totals.captures']: 1}},
            );
        }

        // It's an old promise sir, but it checks out (tried Async, doesn't work with forEach)
        documents.forEach((doc) => {
            void this.factory.model.updateOne(
                {
                    alert: event.alert.alertId,
                    facility: event.facility,
                },
                doc,
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                AlertFacilityControlAggregate.logger.error(`Updating AlertFacilityControlAggregate Error! ${err}`);
            });
        });

        return true;
    }

    public async insertInitial(event: FacilityControlEvent): Promise<boolean> {
        AlertFacilityControlAggregate.logger.debug('Adding Initial AlertFacilityControlAggregate Record');
        const factionKeys = ['vs', 'nc', 'tr', 'totals'];
        const data = {
            alert: event.alert.alertId,
            facility: event.facility,
        };

        factionKeys.forEach((i) => {
            _.mergeWith(
                data,
                {
                    [i]: {
                        captures: 0,
                        defences: 0,
                    },
                },
            );
        });

        try {
            const row = await this.factory.saveDocument(data);
            AlertFacilityControlAggregate.logger.info(`Inserted initial AlertFacilityControl aggregate record for alert ${row.alert}`);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to insert initial AlertFacilityControl aggregate record into DB! ${err}`, 'AlertFacilityControlAggregate');
        }
    }
}
