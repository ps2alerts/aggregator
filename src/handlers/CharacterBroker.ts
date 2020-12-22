import {injectable} from 'inversify';
import {getLogger} from '../logger';
import {Client} from 'ps2census';
import Character from '../data/Character';
import {CharacterWorldOutfitLeader} from '../types/CharacterWorldOutfitLeader';
import {CharacterBrokerInterface} from '../interfaces/CharacterBrokerInterface';
import ApplicationException from '../exceptions/ApplicationException';
import {World} from '../constants/world';
import FakeCharacterFactory from '../constants/fakeCharacter';

@injectable()
export default class CharacterBroker implements CharacterBrokerInterface {
    private static readonly logger = getLogger('CharacterBroker');
    private readonly wsClient: Client;

    constructor(wsClient: Client) {
        this.wsClient = wsClient;
    }

    public async get(characterId: string, world: World): Promise<Character> {
        if (characterId === '0' || !characterId) {
            CharacterBroker.logger.silly('Missing character ID, serving Fake character');
            // Return a fake character with has a faction of none
            return new FakeCharacterFactory(world).build();
        }

        // Grab the character data from Census / Cache
        try {
            const censusCharacter: CharacterWorldOutfitLeader = await this.wsClient.characterManager.fetch(characterId);

            // Convert into Character object
            return new Character(censusCharacter);
        } catch (e) {
            await this.wsClient.characterManager.cache.forget(characterId);
            CharacterBroker.logger.silly(`Forgot cache entry for ${characterId}`);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions,no-console
            throw new ApplicationException(`Unable to properly grab character ${characterId} from Census. Error: ${e.message}`, 'CharacterBroker');
        }
    }
}
