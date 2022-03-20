import {injectable} from 'inversify';
import {getLogger} from '../logger';
import {CensusClient} from 'ps2census';
import Character from '../data/Character';
import {CharacterWorldOutfitLeader} from '../types/CharacterWorldOutfitLeader';
import {CharacterBrokerInterface} from '../interfaces/CharacterBrokerInterface';
import ApplicationException from '../exceptions/ApplicationException';
import {World} from '../constants/world';
import FakeCharacterFactory from '../constants/fakeCharacter';

@injectable()
export default class CharacterBroker implements CharacterBrokerInterface {
    private static readonly logger = getLogger('CharacterBroker');

    constructor(
        private readonly censusClient: CensusClient,
    ) {}

    public async get(characterId: string, world: World): Promise<Character | undefined> {
        if (characterId === '0' || !characterId) {
            CharacterBroker.logger.silly('Missing character ID, serving Fake character');
            // Return a fake character with has a faction of none
            return new FakeCharacterFactory(world).build();
        }

        // Grab the character data from Census / Cache
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const censusCharacter: CharacterWorldOutfitLeader = await this.censusClient.characterManager.fetch(characterId);

            // Convert into Character object
            return new Character(censusCharacter);
        } catch (err) {

            await this.censusClient.characterManager.forget(characterId);
            CharacterBroker.logger.silly(`Forgot cache entry for ${characterId}`);

            if (err instanceof Error) {
                throw new ApplicationException(`Unable to properly grab character ${characterId} from Census. Error: ${err.message}`, 'CharacterBroker');
            }
        }
    }
}
