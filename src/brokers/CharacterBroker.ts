// This broker is responsible for grabbing the requested character data using the built in PS2Census event methods, but handling exceptions.

import Character from '../data/Character';
import {AttackerEvent, MaxRetryException} from 'ps2census';
import ApplicationException from '../exceptions/ApplicationException';
import {injectable} from 'inversify';
import ExceptionHandler from '../handlers/system/ExceptionHandler';
import {CharacterEvent} from 'ps2census/dist/client/events/base/character.event';
import FakeCharacterFactory from '../factories/FakeCharacterFactory';
import {CharacterWorldOutfitLeader} from '../types/CharacterWorldOutfitLeader';

@injectable()
export default class CharacterBroker {
    constructor(
        private readonly fakeCharacterFactory: FakeCharacterFactory,
    ) {}

    public async get(payload: CharacterEvent): Promise<{ character: Character, attacker: Character }> {
        try {
            let attacker: Character;

            const character = new Character(await payload.character());

            if (payload instanceof AttackerEvent) {
                const attackerCharacter = await payload.attacker<CharacterWorldOutfitLeader>();

                if (!attackerCharacter) {
                    throw new Error('AttackerEvent didn\'t resolve attacker character!');
                }

                attacker = new Character(attackerCharacter);
            } else {
                attacker = this.fakeCharacterFactory.build(parseInt(payload.world_id, 10));
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
