import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import DeathEvent from '../../census/events/DeathEvent';
import {Ps2alertsApiMQEndpoints} from '../../../constants/ps2alertsApiMQEndpoints';
import ApiMQMessage from '../../../data/ApiMQMessage';
import VehicleCharacterDeathLogic from '../../../logics/VehicleCharacterDeathLogic';

@injectable()
export default class GlobalVehicleDestroyAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('GlobalVehicleDestroyAggregate');
    private readonly apiMQPublisher: ApiMQPublisher;

    constructor(@inject(TYPES.apiMQPublisher) apiMQPublisher: ApiMQPublisher) {
        this.apiMQPublisher = apiMQPublisher;
    }

    /**
     * Processes the Death event which checks for very specific metrics to do with vehicles
     * @param event
     */
    public async handle(event: DeathEvent): Promise<boolean> {
        GlobalVehicleDestroyAggregate.logger.debug('GlobalVehicleDestroyAggregate.handle');

        const documents = new VehicleCharacterDeathLogic(event, 'GlobalVehicleDestroyAggregate').calculate();

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

        // Victim docs don't apply here

        return true;
    }
}
