import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import FactionUtils from '../../../utils/FactionUtils';
import FacilityControlEvent from '../../census/events/FacilityControlEvent';
import {GlobalFacilityControlAggregateSchemaInterface} from '../../../models/aggregate/global/GlobalFacilityControlAggregateModel';

@injectable()
export default class GlobalFacilityControlAggregate implements AggregateHandlerInterface<FacilityControlEvent> {
    private static readonly logger = getLogger('GlobalFacilityControlAggregate');

    private readonly factory: MongooseModelFactory<GlobalFacilityControlAggregateSchemaInterface>;

    constructor(@inject(TYPES.globalFacilityControlAggregateFactory) factory: MongooseModelFactory<GlobalFacilityControlAggregateSchemaInterface>) {
        this.factory = factory;
    }

    public async handle(event: FacilityControlEvent): Promise<boolean> {
        GlobalFacilityControlAggregate.logger.debug('GlobalFacilityControlAggregate.handle');

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
                    facility: event.facility,
                    world: event.instance.world,
                },
                doc,
                {
                    upsert: true,
                },
            ).catch((err: Error) => {
                if (!err.message.includes('E11000')) {
                    GlobalFacilityControlAggregate.logger.error(`Updating GlobalFacilityControlAggregate Error! ${err.message}`);
                }
            });
        });

        return true;
    }
}
