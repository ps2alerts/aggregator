import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
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
                {
                    upsert: true,
                },
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                InstanceFacilityControlAggregate.logger.error(`Updating InstanceFacilityControlAggregate Error! ${err}`);
            });
        });

        return true;
    }
}
