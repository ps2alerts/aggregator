import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import ApplicationException from '../../../exceptions/ApplicationException';
import {mergeWith} from 'lodash';
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

        // Create initial record if doesn't exist
        if (!await this.factory.model.exists({
            facility: event.facility,
            world: event.instance.world,
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
                    facility: event.facility,
                    world: event.instance.world,
                },
                doc,
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                GlobalFacilityControlAggregate.logger.error(`Updating WorldFacilityControlAggregate Error! ${err}`);
            });
        });

        return true;
    }

    public async insertInitial(event: FacilityControlEvent): Promise<boolean> {
        GlobalFacilityControlAggregate.logger.debug('Adding Initial GlobalFacilityControlAggregate Record');
        const factionKeys = ['vs', 'nc', 'tr', 'totals'];
        const data = {
            facility: event.facility,
            world: event.instance.world,
        };

        factionKeys.forEach((i) => {
            mergeWith(
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
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const row = await this.factory.model.create(data);
            GlobalFacilityControlAggregate.logger.debug(`Inserted initial WorldFacilityControlAggregate record for W: ${row.world} | F: ${row.facility}`);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const error: Error = err;

            if (!error.message.includes('E11000')) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`Unable to insert initial WorldFacilityControlAggregate record into DB! ${err}`, 'GlobalFacilityControlAggregate');
            }
        }

        return false;
    }
}
