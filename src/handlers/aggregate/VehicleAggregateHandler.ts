import {injectable} from 'inversify';
import AggregateHandlerInterface from '../../interfaces/AggregateHandlerInterface';
import VehicleDestroyEvent from '../ps2census/events/VehicleDestroyEvent';
import {getLogger} from '../../logger';
import ApiMQPublisher from '../../services/rabbitmq/publishers/ApiMQPublisher';
import VehicleDestroyLogic from '../../logics/VehicleDestroyLogic';
import {MqAcceptedPatterns} from '../../ps2alerts-constants/mqAcceptedPatterns';
import ApiMQMessage from '../../data/ApiMQMessage';
import ApiMQDelayPublisher from '../../services/rabbitmq/publishers/ApiMQDelayPublisher';
import ApiMQGlobalAggregateMessage from '../../data/ApiMQGlobalAggregateMessage';
import {Bracket} from '../../ps2alerts-constants/bracket';
import ExceptionHandler from '../system/ExceptionHandler';

@injectable()
export default class VehicleAggregateHandler implements AggregateHandlerInterface<VehicleDestroyEvent> {
    private static readonly logger = getLogger('VehicleAggregateHandler');

    constructor(
        private readonly apiMQPublisher: ApiMQPublisher,
        private readonly apiMQDelayPublisher: ApiMQDelayPublisher,
    ) {}

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
                    MqAcceptedPatterns.INSTANCE_VEHICLE_AGGREGATE,
                    documents.attackerDocs,
                    [{
                        instance: event.instance.instanceId,
                        vehicle: event.attackerVehicleId,
                    }],
                ));

                await this.apiMQPublisher.send(new ApiMQMessage(
                    MqAcceptedPatterns.INSTANCE_VEHICLE_CHARACTER_AGGREGATE,
                    documents.attackerDocs,
                    [{
                        instance: event.instance.instanceId,
                        vehicle: event.attackerVehicleId,
                        character: event.attackerCharacter.id,
                    }],
                ));
            } catch (err) {
                new ExceptionHandler('Could not publish instance vehicle aggregate attacker message to API!', err, 'VehicleAggregateHandler.processInstanceAggregates.attacker');
            }
        }

        if (documents.victimDocs.length > 0) {
            try {
                await this.apiMQPublisher.send(new ApiMQMessage(
                    MqAcceptedPatterns.INSTANCE_VEHICLE_AGGREGATE,
                    documents.victimDocs,
                    [{
                        instance: event.instance.instanceId,
                        vehicle: event.vehicleId,
                    }],
                ));

                await this.apiMQPublisher.send(new ApiMQMessage(
                    MqAcceptedPatterns.INSTANCE_VEHICLE_CHARACTER_AGGREGATE,
                    documents.victimDocs,
                    [{
                        instance: event.instance.instanceId,
                        vehicle: event.vehicleId,
                        character: event.character.id,
                    }],
                ));
            } catch (err) {
                new ExceptionHandler('Could not publish instance vehicle aggregate victim message to API!', err, 'VehicleAggregateHandler.processInstanceAggregates.victim');
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
                await this.apiMQDelayPublisher.send(new ApiMQGlobalAggregateMessage(
                    MqAcceptedPatterns.GLOBAL_VEHICLE_AGGREGATE,
                    event.instance.instanceId,
                    documents.attackerDocs,
                    [{
                        vehicle: event.attackerVehicleId,
                        world: event.instance.world,
                    }],
                ), event.instance.duration);

                // Total bracket aggregation
                await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                    MqAcceptedPatterns.GLOBAL_VEHICLE_AGGREGATE,
                    event.instance.instanceId,
                    documents.attackerDocs,
                    [{
                        vehicle: event.attackerVehicleId,
                        world: event.instance.world,
                    }],
                    Bracket.TOTAL,
                ));

                await this.apiMQDelayPublisher.send(new ApiMQGlobalAggregateMessage(
                    MqAcceptedPatterns.GLOBAL_VEHICLE_CHARACTER_AGGREGATE,
                    event.instance.instanceId,
                    documents.attackerDocs,
                    [{
                        vehicle: event.attackerVehicleId,
                        world: event.instance.world,
                        character: event.attackerCharacter.id,
                    }],
                ), event.instance.duration);

                // Total bracket aggregation
                await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                    MqAcceptedPatterns.GLOBAL_VEHICLE_CHARACTER_AGGREGATE,
                    event.instance.instanceId,
                    documents.attackerDocs,
                    [{
                        vehicle: event.attackerVehicleId,
                        world: event.instance.world,
                        character: event.attackerCharacter.id,
                    }],
                    Bracket.TOTAL,
                ));
            } catch (err) {
                new ExceptionHandler('Could not publish global vehicle / character attacker message to API!', err, 'VehicleAggregateHandler.processInstanceAggregates.processGlobalAggregates');
            }
        }

        if (documents.victimDocs.length > 0) {
            try {
                await this.apiMQDelayPublisher.send(new ApiMQGlobalAggregateMessage(
                    MqAcceptedPatterns.GLOBAL_VEHICLE_AGGREGATE,
                    event.instance.instanceId,
                    documents.victimDocs,
                    [{
                        vehicle: event.vehicleId,
                        world: event.instance.world,
                    }],
                ), event.instance.duration);

                await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                    MqAcceptedPatterns.GLOBAL_VEHICLE_AGGREGATE,
                    event.instance.instanceId,
                    documents.victimDocs,
                    [{
                        vehicle: event.vehicleId,
                        world: event.instance.world,
                    }],
                    Bracket.TOTAL,
                ));

                await this.apiMQDelayPublisher.send(new ApiMQGlobalAggregateMessage(
                    MqAcceptedPatterns.GLOBAL_VEHICLE_CHARACTER_AGGREGATE,
                    event.instance.instanceId,
                    documents.victimDocs,
                    [{
                        vehicle: event.attackerVehicleId,
                        world: event.instance.world,
                        character: event.character.id,
                    }],
                ), event.instance.duration);

                await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                    MqAcceptedPatterns.GLOBAL_VEHICLE_CHARACTER_AGGREGATE,
                    event.instance.instanceId,
                    documents.victimDocs,
                    [{
                        vehicle: event.attackerVehicleId,
                        world: event.instance.world,
                        character: event.character.id,
                    }],
                    Bracket.TOTAL,
                ));
            } catch (err) {
                new ExceptionHandler('Could not publish global vehicle / character victim message to API! ', err, 'VehicleAggregateHandler.processInstanceAggregates.processGlobalAggregates');
            }
        }
    }
}
