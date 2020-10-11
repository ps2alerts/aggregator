import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import VehicleDestroyEvent from '../../census/events/VehicleDestroyEvent';
import {Destroy} from 'ps2census';

@injectable()
export default class InstanceVehicleDestroyAggregate implements AggregateHandlerInterface<VehicleDestroyEvent> {
    private static readonly logger = getLogger('InstanceVehicleDestroyAggregate');
    private readonly apiMQPublisher: ApiMQPublisher;

    constructor(@inject(TYPES.apiMQPublisher) apiMQPublisher: ApiMQPublisher) {
        this.apiMQPublisher = apiMQPublisher;
    }

    public async handle(event: VehicleDestroyEvent): Promise<boolean> {
        InstanceVehicleDestroyAggregate.logger.debug('InstanceVehicleDestroyAggregate.handle');
        console.log(event);

        const attackerDocuments = [];
        const victimDocuments = [];

        // Totals are always processed
        attackerDocuments.push({$inc: {totalKills: 1}});
        victimDocuments.push({$inc: {totalDeaths: 1}});

        // Non TKs
        if (event.killType === Destroy.Normal) {
            InstanceVehicleDestroyAggregate.logger.debug('Kill - VvV');

            // Kill - VvV
            if (event.vehicleId) {
                InstanceVehicleDestroyAggregate.logger.debug('Kill - VvV');
                attackerDocuments.push({$inc: {killsVsVehicles: 1}});
                victimDocuments.push({$inc: {deathsVsVehicles: 1}});
            }

            // Kill - VvI - BROKEN
            if (!event.vehicleId) {
                InstanceVehicleDestroyAggregate.logger.debug('Kill - VvI');
                attackerDocuments.push({$inc: {killsVsInfantry: 1}});
                victimDocuments.push({$inc: {deathsVsInfantry: 1}});
            }
        }

        if (event.killType === Destroy.Friendly && event.character.id !== event.attackerCharacter.id) {
            // Kill - TK Vehicles
            if (event.vehicleId) {
                InstanceVehicleDestroyAggregate.logger.debug('VvV TK');
                attackerDocuments.push({$inc: {killsVsVehiclesTk: 1}});
                victimDocuments.push({$inc: {deathsVsVehiclesTk: 1}});
            }

            // Kill - TK Infantry - BROKEN
            if (!event.vehicleId) {
                InstanceVehicleDestroyAggregate.logger.debug('VvI TK');
                attackerDocuments.push({$inc: {killsVsInfantryTk: 1}});
                victimDocuments.push({$inc: {deathsVsInfantryTk: 1}});
            }
        }

        // Death - Suicide
        if (event.killType === Destroy.Friendly && event.character.id === event.attackerCharacter.id) {
            InstanceVehicleDestroyAggregate.logger.debug('VvV Suicide');
            victimDocuments.push({$inc: {deathsSelfDestruct: 1}});
        }

        // Death - World
        if (event.killType === Destroy.Game) {
            InstanceVehicleDestroyAggregate.logger.debug('VvV Restricted Area');
            victimDocuments.push({$inc: {deathsRestrictedArea: 1}});
        }

        // Death - TK

        // Total Deaths

        //

        console.log(attackerDocuments);
        console.log(victimDocuments);

        // try {
        //     await this.apiMQPublisher.send(new ApiMQMessage(
        //         Ps2alertsApiMQEndpoints.INSTANCE_WEAPON_AGGREGATE,
        //         documents,
        //         [{
        //             instance: event.instance.instanceId,
        //             weapon: event.attackerWeaponId,
        //         }],
        //     ));
        // } catch (err) {
        //     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
        //     InstanceVehicleDestroyAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
        // }

        return true;
    }
}
