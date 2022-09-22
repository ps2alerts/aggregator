import LogicInterface from './LogicInterface';
import DeathEvent from '../handlers/ps2census/events/DeathEvent';
import {Kill} from 'ps2census';
import {Logger} from '@nestjs/common';

export default class VehicleCharacterDeathLogic implements LogicInterface {
    private static readonly logger = new Logger('VehicleCharacterDeathLogic');

    constructor(
        private readonly event: DeathEvent,
        private readonly mode = 'UNKNOWN',
    ) {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public calculate(): {attackerDocs: any[], victimDocs: any[]} {
        const attackerDocs = [];

        // VvI
        if (this.event.attackerVehicleId) {
            // If suicide
            if (this.event.attackerCharacter.id === this.event.character.id) {
                VehicleCharacterDeathLogic.logger.debug(`[${this.mode}] Suicide`);
                return {attackerDocs: [], victimDocs: []};
            } else if (this.event.attackerWeapon.id === -2) {
                attackerDocs.push({$inc: {['roadkills']: 1}});
            }

            // If TK
            if (this.event.killType === Kill.TeamKill) {
                if (this.event.attackerCharacter.id !== this.event.character.id) {
                    VehicleCharacterDeathLogic.logger.debug(`[${this.mode}] VvI TK`);
                    attackerDocs.push({$inc: {['infantry.teamkills']: 1}});
                }
            } else {
                VehicleCharacterDeathLogic.logger.debug(`[${this.mode}] VvI Kill`);
                attackerDocs.push({$inc: {['infantry.kills']: 1}});
            }
        }

        return {attackerDocs, victimDocs: []};
    }
}
