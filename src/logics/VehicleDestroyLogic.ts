import VehicleDestroyEvent from '../handlers/census/events/VehicleDestroyEvent';
import LogicInterface from './LogicInterface';
import {Destroy} from 'ps2census';
import {getLogger} from '../logger';

export default class VehicleDestroyLogic implements LogicInterface {
    private static readonly logger = getLogger('VehicleDestroyLogic');

    constructor(
        private readonly event: VehicleDestroyEvent,
        private readonly mode = 'UNKNOWN',
    ) {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public calculate(): {attackerDocs: any[], victimDocs: any[]} {
        const attackerDocs = [];
        const victimDocs = [];

        // IvV
        if (!this.event.attackerVehicleId) {
            if (this.event.killType === Destroy.Normal || this.event.killType === Destroy.Undetermined) {
                VehicleDestroyLogic.logger.silly(`[${this.mode}] IvV death`);
                victimDocs.push({$inc: {['infantry.deaths']: 1}});
            } else if (this.event.attackerCharacter.faction === this.event.character.faction) {
                VehicleDestroyLogic.logger.silly(`[${this.mode}] IvV TK`);
                victimDocs.push({$inc: {['infantry.teamkilled']: 1}});
            }
        }

        // VvV
        if (this.event.attackerVehicleId) {
            // Non TKs
            if (this.event.killType === Destroy.Normal || this.event.killType === Destroy.Undetermined) {
                // Kill - VvV
                VehicleDestroyLogic.logger.silly(`[${this.mode}] VvV`);
                attackerDocs.push({$inc: {['vehicles.kills']: 1}});
                victimDocs.push({$inc: {['vehicles.deaths']: 1}});

                // Matrix
                attackerDocs.push({$inc: {[`vehicleKillMatrix.${this.event.vehicleId}`]: 1}});
                victimDocs.push({$inc: {[`vehicleDeathMatrix.${this.event.attackerVehicleId}`]: 1}});
            }

            // TKs / Suicide
            if (this.event.killType === Destroy.Friendly) {
                if (this.event.character.id !== this.event.attackerCharacter.id) {
                    VehicleDestroyLogic.logger.silly(`[${this.mode}] VvV TK`);
                    attackerDocs.push({$inc: {['vehicles.teamkills']: 1}});
                    victimDocs.push({$inc: {['vehicles.teamkilled']: 1}});

                    // Matrix
                    attackerDocs.push({$inc: {[`vehicleTeamkillMatrix.${this.event.vehicleId}`]: 1}});
                    victimDocs.push({$inc: {[`vehicleTeamkilledMatrix.${this.event.attackerVehicleId}`]: 1}});
                } else {
                    VehicleDestroyLogic.logger.silly(`[${this.mode}] Vehicle suicide`);
                    victimDocs.push({$inc: {['suicides']: 1}});
                }
            }

            // Death - World
            if (this.event.attackerCharacter.id === '0') {
                VehicleDestroyLogic.logger.silly(`[${this.mode}] Vehicle world kill (suicide)`);
                victimDocs.push({$inc: {['suicides']: 1}});
            }
        }

        return {attackerDocs, victimDocs};
    }
}
