import {inject, injectable} from 'inversify';
import {getLogger} from '../../logger';
import ApiMQMessage from '../../data/ApiMQMessage';
import {Ps2alertsApiMQEndpoints} from '../../constants/ps2alertsApiMQEndpoints';
import ApiMQPublisher from '../../services/rabbitmq/publishers/ApiMQPublisher';
import {TYPES} from '../../constants/types';
import DeathEvent from '../census/events/DeathEvent';
import AggregateHandlerInterface from '../../interfaces/AggregateHandlerInterface';
import VehicleCharacterDeathLogic from '../../logics/VehicleCharacterDeathLogic';

@injectable()
export default class VehicleDeathEventHandler implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('VehicleDeathEventHandler');
    private readonly apiMQPublisher: ApiMQPublisher;

    constructor(@inject(TYPES.apiMQPublisher) apiMQPublisher: ApiMQPublisher) {
        this.apiMQPublisher = apiMQPublisher;
    }

    /**
     * Processes the Death event which checks for very specific metrics to do with vehicles
     * @param event
     */
    public async handle(event: DeathEvent): Promise<boolean> {
        VehicleDeathEventHandler.logger.debug('VehicleDeathEventHandler.handle');

        const documents = new VehicleCharacterDeathLogic(event, 'VehicleAggregateHandler').calculate();

        await this.processInstanceAggregates(documents, event);
        await this.processGlobalAggregates(documents, event);

        return true;
    }

    private async processInstanceAggregates(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        documents: {attackerDocs: any[], victimDocs: any[]},
        event: DeathEvent,
    ): Promise<void> {
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

                await this.apiMQPublisher.send(new ApiMQMessage(
                    Ps2alertsApiMQEndpoints.INSTANCE_VEHICLE_CHARACTER_AGGREGATE,
                    documents.attackerDocs,
                    [{
                        instance: event.instance.instanceId,
                        vehicle: event.attackerVehicleId,
                        character: event.attackerCharacter,
                    }],
                ));
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                VehicleDeathEventHandler.logger.error(`Could not publish INSTANCE_VEHICLE_AGGREGATE message to API! E: ${err.message}`);
            }
        }
    }

    private async processGlobalAggregates(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        documents: {attackerDocs: any[], victimDocs: any[]},
        event: DeathEvent,
    ): Promise<void> {
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

                await this.apiMQPublisher.send(new ApiMQMessage(
                    Ps2alertsApiMQEndpoints.GLOBAL_VEHICLE_CHARACTER_AGGREGATE,
                    documents.attackerDocs,
                    [{
                        vehicle: event.attackerVehicleId,
                        world: event.instance.world,
                        character: event.attackerCharacter,
                    }],
                ));
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                VehicleDeathEventHandler.logger.error(`Could not publish message to API! E: ${err.message}`);
            }
        }
    }
}
