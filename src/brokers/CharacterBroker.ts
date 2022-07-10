// This broker is responsible for grabbing the requested character data using the built in PS2Census event methods, but handling exceptions.

import Character from '../data/Character';
import {Death, GainExperience, MaxRetryException, VehicleDestroy} from 'ps2census';
import ApplicationException from '../exceptions/ApplicationException';
import {injectable} from 'inversify';

@injectable()
export default class CharacterBroker {
    public async get(payload: Death | GainExperience | VehicleDestroy): Promise<{ character: Character, attacker: Character | undefined }> {
        let character: Character,
            attacker: Character | undefined;

        const promises = [];

        if (payload.character_id) {
            promises.push(payload.character());
        }

        if (payload instanceof Death || payload instanceof VehicleDestroy) {
            promises.push(payload.attacker());
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            [character, attacker] = await Promise.all(promises);

            return {character, attacker};
        } catch (err) {
            if (err instanceof MaxRetryException) {
                throw new ApplicationException('Census failed to return character data after maximum retries');
            }
        }

        throw new ApplicationException('UNEXPECTED EXECUTION PATH!', 'CharacterBroker');
    }
}
