import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import VehicleDestroyEvent from '../../census/events/VehicleDestroyEvent';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {Ps2alertsApiMQEndpoints} from '../../../constants/ps2alertsApiMQEndpoints';
import VehicleDestroyLogic from '../../../logics/VehicleDestroyLogic';

@injectable()
export default class InstanceVehicleDestroyAggregate implements AggregateHandlerInterface<VehicleDestroyEvent> {
    private static readonly logger = getLogger('InstanceVehicleDestroyAggregate');
    private readonly apiMQPublisher: ApiMQPublisher;

    constructor(@inject(TYPES.apiMQPublisher) apiMQPublisher: ApiMQPublisher) {
        this.apiMQPublisher = apiMQPublisher;
    }

    public async handle(event: VehicleDestroyEvent): Promise<boolean> {
        InstanceVehicleDestroyAggregate.logger.debug('InstanceVehicleDestroyAggregate.handle');

        const documents = new VehicleDestroyLogic(event, 'InstanceVehicleDestroyAggregate').calculate();

        if (documents.attackerDocs.length > 0) {
            try {
                await this.apiMQPublisher.send(new ApiMQMessage(
                    Ps2alertsApiMQEndpoints.INSTANCE_VEHICLE_AGGREGATE,
                    documents.attackerDocs,
                    [{
                        instance: event.instance.instanceId,
                        vehicle: event.attackerVehicleId,
                    }],
                ));
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                InstanceVehicleDestroyAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
            }
        }

        if (documents.victimDocs.length > 0) {
            try {
                await this.apiMQPublisher.send(new ApiMQMessage(
                    Ps2alertsApiMQEndpoints.INSTANCE_VEHICLE_AGGREGATE,
                    documents.victimDocs,
                    [{
                        instance: event.instance.instanceId,
                        vehicle: event.vehicleId,
                    }],
                ));
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                InstanceVehicleDestroyAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
            }
        }

        return true;
    }
}
