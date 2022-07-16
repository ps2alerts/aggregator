// This broker is responsible for grabbing the requested character data using the built in PS2Census event methods, but handling exceptions.

import Character from '../data/Character';
import {AttackerEvent, CharacterManager, MaxRetryException} from 'ps2census';
import ApplicationException from '../exceptions/ApplicationException';
import {injectable} from 'inversify';
import ExceptionHandler from '../handlers/system/ExceptionHandler';
import {CharacterEvent} from 'ps2census/dist/client/events/base/character.event';
import FakeCharacterFactory from '../factories/FakeCharacterFactory';

@injectable()
export default class CharacterBroker {
    constructor(
        private readonly characterManager: CharacterManager,
        private readonly fakeCharacterFactory: FakeCharacterFactory,
    ) {}

    public async get(payload: CharacterEvent): Promise<{ character: Character, attacker: Character }> {
        try {
            let character: Character;
            let attacker: Character;

            if (payload.character_id && payload.character_id !== '0') {
                character = new Character(await this.characterManager.fetch(payload.character_id));
            } else {
                character = await this.fakeCharacterFactory.build(parseInt(payload.world_id, 10));
            }

            if (payload instanceof AttackerEvent && payload.attacker_character_id && payload.attacker_character_id !== '0') {
                attacker = new Character(await this.characterManager.fetch(payload.attacker_character_id));
            } else {
                attacker = await this.fakeCharacterFactory.build(parseInt(payload.world_id, 10));
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
