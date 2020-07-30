import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import ApplicationException from '../../../exceptions/ApplicationException';
import _ from 'lodash';
import FacilityControlEvent from '../../census/events/FacilityControlEvent';
import {InstanceFacilityControlAggregateInterface} from '../../../models/aggregate/instance/InstanceFacilityControlAggregateModel';
import FactionUtils from '../../../utils/FactionUtils';

@injectable()
export default class InstanceFacilityControlAggregate implements AggregateHandlerInterface<FacilityControlEvent> {
    private static readonly logger = getLogger('InstanceFacilityControlAggregate');

    private readonly factory: MongooseModelFactory<InstanceFacilityControlAggregateInterface>;

    constructor(@inject(TYPES.instanceFacilityControlAggregateFactory) factory: MongooseModelFactory<InstanceFacilityControlAggregateInterface>) {
        this.factory = factory;
    }

    public async handle(event: FacilityControlEvent): Promise<boolean> {
        InstanceFacilityControlAggregate.logger.debug('InstanceFacilityControlAggregate.handle');

        // Create initial record if doesn't exist
        if (!await this.factory.model.exists({
            instance: event.instance.instanceId,
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
        } else {
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
                    instance: event.instance.instanceId,
                    facility: event.facility,
                },
                doc,
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                InstanceFacilityControlAggregate.logger.error(`Updating InstanceFacilityControlAggregate Error! ${err}`);
            });
        });

        return true;
    }

    public async insertInitial(event: FacilityControlEvent): Promise<boolean> {
        InstanceFacilityControlAggregate.logger.debug('Adding Initial InstanceFacilityControlAggregate Record');
        const factionKeys = ['vs', 'nc', 'tr', 'totals'];
        const data = {
            instance: event.instance.instanceId,
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
            const row = await this.factory.model.create(data);
            InstanceFacilityControlAggregate.logger.debug(`Inserted initial InstanceFacilityControlAggregate record for Instance: ${row.instance}`);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const error: Error = err;

            if (!error.message.includes('E11000')) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`Unable to insert initial InstanceFacilityControlAggregate record into DB! ${err}`, 'InstanceFacilityControlAggregate');
            }
        }

        return false;
    }
}
