import LogicInterface from './LogicInterface';
import {getLogger} from '../logger';
import DeathEvent from '../handlers/census/events/DeathEvent';

export default class VehicleCharacterDeathLogic implements LogicInterface {
    private static readonly logger = getLogger('VehicleCharacterDeathLogic');
    private readonly event: DeathEvent;
    private readonly mode: string;

    constructor(event: DeathEvent, mode = 'UNKNOWN') {
        this.event = event;
        this.mode = mode;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public calculate(): {attackerDocs: any[], victimDocs: any[]} {
        const attackerDocs = [];

        // VvI
        if (this.event.attackerVehicleId) {
            // If suicide
            if (this.event.attackerCharacter.id === this.event.character.id) {
                VehicleCharacterDeathLogic.logger.silly(`[${this.mode}] Suicide`);

                return {attackerDocs: [], victimDocs: []};
            }

            // If TK
            if (this.event.attackerCharacter.faction === this.event.character.faction) {
                if (this.event.attackerCharacter.id !== this.event.character.id) {
                    VehicleCharacterDeathLogic.logger.silly(`[${this.mode}] VvI TK`);
                    attackerDocs.push({$inc: {['infantry.teamkills']: 1}});
                }
            } else {
                VehicleCharacterDeathLogic.logger.silly(`[${this.mode}] VvI Kill`);
                attackerDocs.push({$inc: {['infantry.kills']: 1}});
            }
        }

        return {attackerDocs, victimDocs: []};
    }
}
