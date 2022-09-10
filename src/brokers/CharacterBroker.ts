// This broker is responsible for grabbing the requested character data using the built in PS2Census event methods, but handling exceptions.

import Character from '../data/Character';
import {AttackerEvent, MaxRetryException} from 'ps2census';
import ApplicationException from '../exceptions/ApplicationException';
import {injectable} from 'inversify';
import ExceptionHandler from '../handlers/system/ExceptionHandler';
import {CharacterEvent} from 'ps2census/dist/client/events/base/character.event';
import FakeCharacterFactory from '../factories/FakeCharacterFactory';
import {getLogger} from '../logger';

@injectable()
export default class CharacterBroker {
    private static readonly logger = getLogger('CharacterBroker');

    constructor(
        private readonly fakeCharacterFactory: FakeCharacterFactory,
    ) {}

    public async get(payload: CharacterEvent): Promise<{ character: Character, attacker: Character }> {
        try {
            // Set a default in case attacker doesn't result
            let character: Character;
            let attacker = this.fakeCharacterFactory.build(parseInt(payload.world_id, 10));

            const characterActuallyExists = payload.character_id && payload.character_id !== '0';

            // Only attempt to get the character if one exists to grab
            if (characterActuallyExists) {
                character = new Character(await payload.character());
            } else {
                character = this.fakeCharacterFactory.build(parseInt(payload.world_id, 10));
            }

            if (payload instanceof AttackerEvent) {
                // Re-create character with teamID supplied, if character exists
                if (characterActuallyExists) {
                    character = new Character(await payload.character(), parseInt(payload.team_id, 10));
                }

                if (!payload.attacker_character_id || payload.attacker_character_id === '0') {
                    attacker = this.fakeCharacterFactory.build(parseInt(payload.world_id, 10));
                    CharacterBroker.logger.error('AttackerEvent had no actual attacker character ID! ps2census bug');
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    const attackerCharacter = await payload.attacker();

                    if (attackerCharacter) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                        attacker = new Character(attackerCharacter, parseInt(payload.attacker_team_id, 10));
                    } // Else serve fake
                }
            }

            return {character, attacker};
        } catch (err) {
            if (err instanceof MaxRetryException) {
                new ExceptionHandler('Census failed to return character data after maximum retries', err, 'CharacterBroker');
            }

            new ExceptionHandler('Census failed to return character data not due to retries!', err, 'CharacterBroker');
        }

        throw new ApplicationException('CharacterBroker failed to return characters, even fake ones!', 'CharacterBroker');
    }
}
