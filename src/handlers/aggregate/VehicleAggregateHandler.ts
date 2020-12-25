import {inject, injectable} from 'inversify';
import AggregateHandlerInterface from '../../interfaces/AggregateHandlerInterface';
import VehicleDestroyEvent from '../census/events/VehicleDestroyEvent';
import {getLogger} from '../../logger';
import ApiMQPublisher from '../../services/rabbitmq/publishers/ApiMQPublisher';
import {TYPES} from '../../constants/types';
import VehicleDestroyLogic from '../../logics/VehicleDestroyLogic';
import {MQAcceptedPatterns} from '../../constants/MQAcceptedPatterns';
import ApiMQMessage from '../../data/ApiMQMessage';

@injectable()
export default class VehicleAggregateHandler implements AggregateHandlerInterface<VehicleDestroyEvent> {
    private static readonly logger = getLogger('VehicleAggregateHandler');
    private readonly apiMQPublisher: ApiMQPublisher;

    constructor(@inject(TYPES.apiMQPublisher) apiMQPublisher: ApiMQPublisher) {
        this.apiMQPublisher = apiMQPublisher;
    }

    public async handle(event: VehicleDestroyEvent): Promise<boolean> {
        VehicleAggregateHandler.logger.silly('VehicleAggregateHandler.handle');

        const documents = new VehicleDestroyLogic(event, 'VehicleAggregateHandler').calculate();

        await this.processInstanceAggregates(documents, event);
        await this.processGlobalAggregates(documents, event);

        return true;
    }

    private async processInstanceAggregates(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        documents: {attackerDocs: any[], victimDocs: any[]},
        event: VehicleDestroyEvent,
    ): Promise<void> {
        if (documents.attackerDocs.length > 0) {
            try {
                await this.apiMQPublisher.send(new ApiMQMessage(
                    MQAcceptedPatterns.INSTANCE_VEHICLE_AGGREGATE,
                    documents.attackerDocs,
                    [{
                        instance: event.instance.instanceId,
                        vehicle: event.attackerVehicleId,
                    }],
                ));
                await this.apiMQPublisher.send(new ApiMQMessage(
                    MQAcceptedPatterns.INSTANCE_VEHICLE_CHARACTER_AGGREGATE,
                    documents.attackerDocs,
                    [{
                        instance: event.instance.instanceId,
                        vehicle: event.attackerVehicleId,
                        character: event.attackerCharacter.id,
                    }],
                ));
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                VehicleAggregateHandler.logger.error(`Could not publish instance vehicle / character attacker message to API! E: ${err.message}`);
            }
        }

        if (documents.victimDocs.length > 0) {
            try {
                await this.apiMQPublisher.send(new ApiMQMessage(
                    MQAcceptedPatterns.INSTANCE_VEHICLE_AGGREGATE,
                    documents.victimDocs,
                    [{
                        instance: event.instance.instanceId,
                        vehicle: event.vehicleId,
                    }],
                ));

                await this.apiMQPublisher.send(new ApiMQMessage(
                    MQAcceptedPatterns.INSTANCE_VEHICLE_CHARACTER_AGGREGATE,
                    documents.victimDocs,
                    [{
                        instance: event.instance.instanceId,
                        vehicle: event.vehicleId,
                        character: event.character.id,
                    }],
                ));
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                VehicleAggregateHandler.logger.error(`Could not publish instance vehicle / character victim message to API! E: ${err.message}`);
            }
        }
    }

    private async processGlobalAggregates(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        documents: {attackerDocs: any[], victimDocs: any[]},
        event: VehicleDestroyEvent,
    ): Promise<void> {
        if (documents.attackerDocs.length > 0) {
            try {
                await this.apiMQPublisher.send(new ApiMQMessage(
                    MQAcceptedPatterns.GLOBAL_VEHICLE_AGGREGATE,
                    documents.attackerDocs,
                    [{
                        vehicle: event.attackerVehicleId,
                        world: event.instance.world,
                    }],
                ));
                await this.apiMQPublisher.send(new ApiMQMessage(
                    MQAcceptedPatterns.GLOBAL_VEHICLE_CHARACTER_AGGREGATE,
                    documents.attackerDocs,
                    [{
                        vehicle: event.attackerVehicleId,
                        world: event.instance.world,
                        'character.id': event.attackerCharacter.id,
                    }],
                ));
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                VehicleAggregateHandler.logger.error(`Could not publish global vehicle / character attacker message to API! E: ${err.message}`);
            }
        }

        if (documents.victimDocs.length > 0) {
            try {
                await this.apiMQPublisher.send(new ApiMQMessage(
                    MQAcceptedPatterns.GLOBAL_VEHICLE_AGGREGATE,
                    documents.victimDocs,
                    [{
                        vehicle: event.vehicleId,
                        world: event.instance.world,
                    }],
                ));
                await this.apiMQPublisher.send(new ApiMQMessage(
                    MQAcceptedPatterns.GLOBAL_VEHICLE_CHARACTER_AGGREGATE,
                    documents.victimDocs,
                    [{
                        vehicle: event.attackerVehicleId,
                        world: event.instance.world,
                        'character.id': event.character.id,
                    }],
                ));
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                VehicleAggregateHandler.logger.error(`Could not publish global vehicle / character victim message to API! E: ${err.message}`);
            }
        }
    }
}
