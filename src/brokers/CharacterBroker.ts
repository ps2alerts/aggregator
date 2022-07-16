// This broker is responsible for grabbing the requested character data using the built in PS2Census event methods, but handling exceptions.

import Character from '../data/Character';
import {AttackerEvent, MaxRetryException} from 'ps2census';
import ApplicationException from '../exceptions/ApplicationException';
import {injectable} from 'inversify';
import ExceptionHandler from '../handlers/system/ExceptionHandler';
import {CharacterEvent} from 'ps2census/dist/client/events/base/character.event';

@injectable()
export default class CharacterBroker {
    public async get(payload: CharacterEvent): Promise<{ character: Character, attacker: Character | undefined }> {
        let character: Character,
            attacker: Character | undefined;

        const promises = [];

        if (payload.character_id && payload.character_id !== '0') {
            promises.push(payload.character());
        }

        if (payload instanceof AttackerEvent && payload.attacker_character_id && payload.attacker_character_id !== '0') {
            promises.push(payload.attacker());
        }

        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            [character, attacker] = await Promise.all(promises);

            return {character, attacker};
        } catch (err) {
            if (err instanceof MaxRetryException) {
                new ExceptionHandler('Census failed to return character data after maximum retries', err, 'CharacterBroker');
            }

            new ExceptionHandler('Census failed to return character data not due to retries!', err, 'CharacterBroker');
        }

        throw new ApplicationException('UNEXPECTED EXECUTION PATH!', 'CharacterBroker');
    }
}
