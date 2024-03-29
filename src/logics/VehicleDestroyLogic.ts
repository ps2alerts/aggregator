import VehicleDestroyEvent from '../handlers/ps2census/events/VehicleDestroyEvent';
import LogicInterface from './LogicInterface';
import {Destroy} from 'ps2census';
import {Logger} from '@nestjs/common';

export default class VehicleDestroyLogic implements LogicInterface {
    private static readonly logger = new Logger('VehicleDestroyLogic');

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
            if (this.event.killType === Destroy.Normal) {
                VehicleDestroyLogic.logger.verbose(`[${this.mode}] IvV death`);
                victimDocs.push({$inc: {['infantry.deaths']: 1}});
            } else if (this.event.killType === Destroy.Friendly) {
                VehicleDestroyLogic.logger.verbose(`[${this.mode}] IvV TK`);
                victimDocs.push({$inc: {['infantry.teamkilled']: 1}});
            }
        }

        // VvV
        if (this.event.attackerVehicleId) {
            // Non TKs
            if (this.event.killType === Destroy.Normal) {
                // Kill - VvV
                VehicleDestroyLogic.logger.verbose(`[${this.mode}] VvV`);
                attackerDocs.push({$inc: {['vehicles.kills']: 1}});
                victimDocs.push({$inc: {['vehicles.deaths']: 1}});

                // Matrix
                attackerDocs.push({$inc: {[`vehicleKillMatrix.${this.event.vehicleId}`]: 1}});
                victimDocs.push({$inc: {[`vehicleDeathMatrix.${this.event.attackerVehicleId}`]: 1}});
            }

            // TKs / Suicide
            if (this.event.killType === Destroy.Friendly) {
                if (this.event.character.id !== this.event.attackerCharacter.id) {
                    VehicleDestroyLogic.logger.verbose(`[${this.mode}] VvV TK`);
                    attackerDocs.push({$inc: {['vehicles.teamkills']: 1}});
                    victimDocs.push({$inc: {['vehicles.teamkilled']: 1}});

                    // Matrix
                    attackerDocs.push({$inc: {[`vehicleTeamkillMatrix.${this.event.vehicleId}`]: 1}});
                    victimDocs.push({$inc: {[`vehicleTeamkilledMatrix.${this.event.attackerVehicleId}`]: 1}});
                } else {
                    VehicleDestroyLogic.logger.verbose(`[${this.mode}] Vehicle suicide`);
                    victimDocs.push({$inc: {['suicides']: 1}});
                }
            }

            // Death - World
            if (this.event.attackerCharacter.id === '0') {
                VehicleDestroyLogic.logger.verbose(`[${this.mode}] Vehicle world kill (suicide)`);
                victimDocs.push({$inc: {['suicides']: 1}});
            }
        }

        return {attackerDocs, victimDocs};
    }
}
