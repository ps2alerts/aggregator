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
export default class GlobalVehicleDestroyAggregate implements AggregateHandlerInterface<VehicleDestroyEvent> {
    private static readonly logger = getLogger('GlobalVehicleDestroyAggregate');
    private readonly apiMQPublisher: ApiMQPublisher;

    constructor(@inject(TYPES.apiMQPublisher) apiMQPublisher: ApiMQPublisher) {
        this.apiMQPublisher = apiMQPublisher;
    }

    public async handle(event: VehicleDestroyEvent): Promise<boolean> {
        GlobalVehicleDestroyAggregate.logger.debug('GlobalVehicleDestroyAggregate.handle');

        const documents = new VehicleDestroyLogic(event, 'GlobalVehicleDestroyAggregate').calculate();

        if (documents.attackerDocs.length > 0) {
            try {
                await this.apiMQPublisher.send(new ApiMQMessage(
                    Ps2alertsApiMQEndpoints.GLOBAL_VEHICLE_AGGREGATE,
                    documents.attackerDocs,
                    [{
                        vehicle: event.attackerVehicleId,
                        world: event.instance.world,
                    }],
                ));
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                GlobalVehicleDestroyAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
            }
        }

        if (documents.victimDocs.length > 0) {
            try {
                await this.apiMQPublisher.send(new ApiMQMessage(
                    Ps2alertsApiMQEndpoints.GLOBAL_VEHICLE_AGGREGATE,
                    documents.victimDocs,
                    [{
                        vehicle: event.vehicleId,
                        world: event.instance.world,
                    }],
                ));
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                GlobalVehicleDestroyAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
            }
        }

        return true;
    }
}
