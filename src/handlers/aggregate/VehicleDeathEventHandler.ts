import {Injectable, Logger} from '@nestjs/common';
import ApiMQMessage from '../../data/ApiMQMessage';
import {MqAcceptedPatterns} from '../../ps2alerts-constants/mqAcceptedPatterns';
import ApiMQPublisher from '../../modules/rabbitmq/publishers/ApiMQPublisher';
import DeathEvent from '../ps2census/events/DeathEvent';
import AggregateHandlerInterface from '../../interfaces/AggregateHandlerInterface';
import VehicleCharacterDeathLogic from '../../logics/VehicleCharacterDeathLogic';
import ApiMQDelayPublisher from '../../modules/rabbitmq/publishers/ApiMQDelayPublisher';
import ApiMQGlobalAggregateMessage from '../../data/ApiMQGlobalAggregateMessage';
import {Bracket} from '../../ps2alerts-constants/bracket';
import ExceptionHandler from '../system/ExceptionHandler';

@Injectable()
export default class VehicleDeathEventHandler implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = new Logger('VehicleDeathEventHandler');

    constructor(
        private readonly apiMQPublisher: ApiMQPublisher,
        private readonly apiMQDelayPublisher: ApiMQDelayPublisher,
    ) {}

    /**
     * Processes the Death event which checks for very specific metrics to do with vehicles
     * @param event
     */
    public async handle(event: DeathEvent): Promise<boolean> {
        VehicleDeathEventHandler.logger.verbose('VehicleDeathEventHandler.handle');

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
                new ExceptionHandler('Could not publish instance vehicle aggregate message to API!', err, 'VehicleDeathEventHandler.processInstanceAggregates');
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
                await this.apiMQDelayPublisher.send(new ApiMQGlobalAggregateMessage(
                    MqAcceptedPatterns.GLOBAL_VEHICLE_AGGREGATE,
                    event.instance.instanceId,
                    documents.attackerDocs,
                    [{
                        world: event.instance.world,
                        vehicle: event.attackerVehicleId,
                    }],
                ), event.instance.duration);

                await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                    MqAcceptedPatterns.GLOBAL_VEHICLE_AGGREGATE,
                    event.instance.instanceId,
                    documents.attackerDocs,
                    [{
                        world: event.instance.world,
                        vehicle: event.attackerVehicleId,
                    }],
                    Bracket.TOTAL,
                ));

                await this.apiMQDelayPublisher.send(new ApiMQGlobalAggregateMessage(
                    MqAcceptedPatterns.GLOBAL_VEHICLE_CHARACTER_AGGREGATE,
                    event.instance.instanceId,
                    documents.attackerDocs,
                    [{
                        world: event.instance.world,
                        vehicle: event.attackerVehicleId,
                        character: event.character.id,
                    }],
                ), event.instance.duration);

                await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                    MqAcceptedPatterns.GLOBAL_VEHICLE_CHARACTER_AGGREGATE,
                    event.instance.instanceId,
                    documents.attackerDocs,
                    [{
                        world: event.instance.world,
                        vehicle: event.attackerVehicleId,
                        character: event.character.id,
                    }],
                    Bracket.TOTAL,
                ));
            } catch (err) {
                new ExceptionHandler('Could not publish global vehicle aggregate message to API!', err, 'VehicleDeathEventHandler.processGlobalAggregates');
            }
        }
    }
}
