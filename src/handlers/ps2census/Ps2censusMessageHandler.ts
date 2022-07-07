import {injectable} from 'inversify';
import {PS2Event} from 'ps2census';
// import InstanceAuthority from '../../authorities/InstanceAuthority';

@injectable()
export default class Ps2censusMessageHandler {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async handle(event: PS2Event): Promise<void> {
        // const worldId = parseInt(event.world_id, 10);

        // // If the class is a Zone ID supported class
        // // eslint-disable-next-line no-prototype-builtins
        // if (event.hasOwnProperty('zone_id')) {
        //     // BOW TO ME MORTAL
        //     /* eslint-disable */
        //     // @ts-ignore
        //     const zoneId = parseInt(censusClass.zone_id, 10);
        //     /* eslint-enable */
        //
        //     if (!this.instanceAuthority.getInstances(worldId, zoneId)) {
        //         throw new ApplicationException(`[${this.queueName}] No active instance on W: ${worldId} - Z: ${zoneId}`, 'WorldSubscription.parseMessage');
        //     }
        // }
    }
}
