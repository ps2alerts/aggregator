import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import VehicleDestroyEvent from '../../census/events/VehicleDestroyEvent';
import {Destroy} from 'ps2census';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {Ps2alertsApiMQEndpoints} from '../../../constants/ps2alertsApiMQEndpoints';

@injectable()
export default class InstanceVehicleDestroyAggregate implements AggregateHandlerInterface<VehicleDestroyEvent> {
    private static readonly logger = getLogger('InstanceVehicleDestroyAggregate');
    private readonly apiMQPublisher: ApiMQPublisher;

    constructor(@inject(TYPES.apiMQPublisher) apiMQPublisher: ApiMQPublisher) {
        this.apiMQPublisher = apiMQPublisher;
    }

    public async handle(event: VehicleDestroyEvent): Promise<boolean> {
        InstanceVehicleDestroyAggregate.logger.debug('InstanceVehicleDestroyAggregate.handle');

        const attackerDocs = [];
        const victimDocs = [];

        // IvV
        if (!event.attackerVehicleId) {
            if (event.killType === Destroy.Normal) {
                victimDocs.push({$inc: {['infantry.deaths']: 1}});
            } else {
                victimDocs.push({$inc: {['infantry.teamkilled']: 1}});
            }
        }

        // VvV
        if (event.attackerVehicleId) {
            // Non TKs
            if (event.killType === Destroy.Normal) {
                // Kill - VvV
                InstanceVehicleDestroyAggregate.logger.debug('VvV');
                attackerDocs.push({$inc: {['vehicles.kills']: 1}});
                victimDocs.push({$inc: {['vehicles.deaths']: 1}});

                // Matrix
                attackerDocs.push({$inc: {[`vehicleKillMatrix.${event.vehicleId}`]: 1}});
                victimDocs.push({$inc: {[`vehicleDeathMatrix.${event.attackerVehicleId}`]: 1}});
            }

            // TKs / Suicide
            if (event.killType === Destroy.Friendly) {
                if (event.character.id !== event.attackerCharacter.id) {
                    InstanceVehicleDestroyAggregate.logger.debug('VvV TK');
                    attackerDocs.push({$inc: {['vehicles.teamkills']: 1}});
                    victimDocs.push({$inc: {['vehicles.teamkilled']: 1}});

                    // Matrix
                    attackerDocs.push({$inc: {[`vehicleTeamkillMatrix.${event.vehicleId}`]: 1}});
                    victimDocs.push({$inc: {[`vehicleTeamkilledMatrix.${event.attackerVehicleId}`]: 1}});
                } else {
                    InstanceVehicleDestroyAggregate.logger.debug('Vehicle self destruct');
                    victimDocs.push({$inc: {['suicides']: 1}});
                }
            }

            // Death - World
            if (event.attackerCharacter.id === '0') {
                InstanceVehicleDestroyAggregate.logger.debug('Vehicle world kill (suicide)');
                victimDocs.push({$inc: {['suicides']: 1}});
            }
        }

        if (attackerDocs.length > 0) {
            try {
                await this.apiMQPublisher.send(new ApiMQMessage(
                    Ps2alertsApiMQEndpoints.INSTANCE_VEHICLE_AGGREGATE,
                    attackerDocs,
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

        try {
            await this.apiMQPublisher.send(new ApiMQMessage(
                Ps2alertsApiMQEndpoints.INSTANCE_VEHICLE_AGGREGATE,
                victimDocs,
                [{
                    instance: event.instance.instanceId,
                    vehicle: event.vehicleId,
                }],
            ));
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            InstanceVehicleDestroyAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
        }

        return true;
    }
}
