import {injectable} from 'inversify';
import {getLogger} from '../../logger';
import ApiMQMessage from '../../data/ApiMQMessage';
import {MQAcceptedPatterns} from '../../constants/MQAcceptedPatterns';
import ApiMQPublisher from '../../services/rabbitmq/publishers/ApiMQPublisher';
import DeathEvent from '../census/events/DeathEvent';
import AggregateHandlerInterface from '../../interfaces/AggregateHandlerInterface';
import VehicleCharacterDeathLogic from '../../logics/VehicleCharacterDeathLogic';
import ApiMQDelayPublisher from '../../services/rabbitmq/publishers/ApiMQDelayPublisher';
import ApiMQGlobalAggregateMessage from '../../data/ApiMQGlobalAggregateMessage';
import {Bracket} from '../../constants/bracket';

@injectable()
export default class VehicleDeathEventHandler implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('VehicleDeathEventHandler');

    constructor(
        private readonly apiMQPublisher: ApiMQPublisher,
        private readonly apiMQDelayPublisher: ApiMQDelayPublisher,
    ) {}

    /**
     * Processes the Death event which checks for very specific metrics to do with vehicles
     * @param event
     */
    public async handle(event: DeathEvent): Promise<boolean> {
        VehicleDeathEventHandler.logger.silly('VehicleDeathEventHandler.handle');

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
                if (err instanceof Error) {
                    VehicleDeathEventHandler.logger.error(`Could not publish INSTANCE_VEHICLE_AGGREGATE message to API! E: ${err.message}`);
                }
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
                    MQAcceptedPatterns.GLOBAL_VEHICLE_AGGREGATE,
                    event.instance.instanceId,
                    documents.attackerDocs,
                    [{
                        world: event.instance.world,
                        vehicle: event.attackerVehicleId,
                    }],
                ), event.instance.duration);

                await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                    MQAcceptedPatterns.GLOBAL_VEHICLE_AGGREGATE,
                    event.instance.instanceId,
                    documents.attackerDocs,
                    [{
                        world: event.instance.world,
                        vehicle: event.attackerVehicleId,
                    }],
                    Bracket.TOTAL,
                ));

                await this.apiMQDelayPublisher.send(new ApiMQGlobalAggregateMessage(
                    MQAcceptedPatterns.GLOBAL_VEHICLE_CHARACTER_AGGREGATE,
                    event.instance.instanceId,
                    documents.attackerDocs,
                    [{
                        world: event.instance.world,
                        vehicle: event.attackerVehicleId,
                        character: event.character.id,
                    }],
                ), event.instance.duration);

                await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                    MQAcceptedPatterns.GLOBAL_VEHICLE_CHARACTER_AGGREGATE,
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
                if (err instanceof Error) {
                    VehicleDeathEventHandler.logger.error(`Could not publish message to API! E: ${err.message}`);
                }
            }
        }
    }
}
