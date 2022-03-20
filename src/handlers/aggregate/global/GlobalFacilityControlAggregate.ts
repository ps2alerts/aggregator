/* eslint-disable @typescript-eslint/naming-convention */
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import FactionUtils from '../../../utils/FactionUtils';
import FacilityControlEvent from '../../census/events/FacilityControlEvent';
import {MQAcceptedPatterns} from '../../../constants/MQAcceptedPatterns';
import ApiMQDelayPublisher from '../../../services/rabbitmq/publishers/ApiMQDelayPublisher';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import {Bracket} from '../../../constants/bracket';

@injectable()
export default class GlobalFacilityControlAggregate implements AggregateHandlerInterface<FacilityControlEvent> {
    private static readonly logger = getLogger('GlobalFacilityControlAggregate');

    constructor(
        @inject(TYPES.apiMQPublisher) private readonly apiMQPublisher: ApiMQPublisher,
        @inject(TYPES.apiMQDelayPublisher) private readonly apiMQDelayPublisher: ApiMQDelayPublisher,
    ) {}

    public async handle(event: FacilityControlEvent): Promise<boolean> {
        GlobalFacilityControlAggregate.logger.silly('GlobalFacilityControlAggregate.handle');

        const newFactionName = FactionUtils.parseFactionIdToShortName(event.newFaction);
        const oldFactionName = FactionUtils.parseFactionIdToShortName(event.oldFaction);

        const documents = [];

        documents.push({$setOnInsert: {
            facility: event.facility,
        }});

        if (event.isDefence) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const defenceKey = `${newFactionName}.defences`;
            documents.push(
                {$inc: {[defenceKey]: 1}},
                {$inc: {['totals.defences']: 1}},
            );
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/restrict-template-expressions
            const captureKey = `${newFactionName}.captures`;
            const captureTakenKey = `${newFactionName}.takenFrom.${oldFactionName}`;
            const captureLostKey = `${oldFactionName}.lostTo.${newFactionName}`;
            documents.push(
                {$inc: {[captureKey]: 1}},
                {$inc: {[captureTakenKey]: 1}},
                {$inc: {[captureLostKey]: 1}},
                {$inc: {['totals.captures']: 1}},
            );
        }

        try {
            await this.apiMQDelayPublisher.send(new ApiMQGlobalAggregateMessage(
                MQAcceptedPatterns.GLOBAL_FACILITY_CONTROL_AGGREGATE,
                event.instance.instanceId,
                documents,
                [{
                    world: event.instance.world,
                    'facility.id': event.facility.id,
                }],
            ), event.instance.duration);

            // Total bracket aggregation
            await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                MQAcceptedPatterns.GLOBAL_FACILITY_CONTROL_AGGREGATE,
                event.instance.instanceId,
                documents,
                [{
                    world: event.instance.world,
                    facility: event.facility,
                }],
                Bracket.TOTAL,
            ));
        } catch (err) {
            if (err instanceof Error) {
                GlobalFacilityControlAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
            }
        }

        return true;
    }
}
