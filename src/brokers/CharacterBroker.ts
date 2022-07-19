// This broker is responsible for grabbing the requested character data using the built in PS2Census event methods, but handling exceptions.

import Character from '../data/Character';
import {AttackerEvent, MaxRetryException} from 'ps2census';
import ApplicationException from '../exceptions/ApplicationException';
import {injectable} from 'inversify';
import ExceptionHandler from '../handlers/system/ExceptionHandler';
import {CharacterEvent} from 'ps2census/dist/client/events/base/character.event';
import FakeCharacterFactory from '../factories/FakeCharacterFactory';
import {CharacterWorldOutfitLeader} from '../types/CharacterWorldOutfitLeader';
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
            let character = this.fakeCharacterFactory.build(parseInt(payload.world_id, 10));
            let attacker = this.fakeCharacterFactory.build(parseInt(payload.world_id, 10));

            if (payload.character_id && payload.character_id !== '0') {
                character = new Character(await payload.character());
            }

            if (payload instanceof AttackerEvent) {
                if (!payload.attacker_character_id || payload.attacker_character_id === '0') {
                    throw new Error('AttackerEvent had no actual attacker character ID! ps2census bug');
                }

                const attackerCharacter = await payload.attacker<CharacterWorldOutfitLeader>();

                if (!attackerCharacter) {
                    CharacterBroker.logger.warn('AttackerEvent returned no attacker!');
                } else {
                    attacker = new Character(attackerCharacter);
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
