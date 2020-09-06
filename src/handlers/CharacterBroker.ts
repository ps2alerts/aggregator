import {inject, injectable} from 'inversify';
import {getLogger} from '../logger';
import {RedisConnection} from '../services/redis/RedisConnection';
import {Client} from 'ps2census';
import {Redis} from 'ioredis';
import Character from '../data/Character';
import {CharacterWorldOutfitResolved} from '../types/CharacterWorldOutfitResolvedType';
import {CharacterBrokerInterface} from '../interfaces/CharacterBrokerInterface';
import ApplicationException from '../exceptions/ApplicationException';

@injectable()
export default class CharacterBroker implements CharacterBrokerInterface {
    private static readonly logger = getLogger('CharacterBroker');

    private readonly cacheDriver: Redis;

    private readonly wsClient: Client;

    constructor(
    @inject(RedisConnection) cacheDriver: RedisConnection,
        @inject(Client) wsClient: Client,
    ) {
        this.cacheDriver = cacheDriver.getClient();
        this.wsClient = wsClient;
    }

    public async get(characterId: string): Promise<Character> {
        if (characterId === '0' || !characterId) {
            throw new ApplicationException('No character ID was supplied!', 'CharacterBroker');
        }

        // Grab the character data from Census / Cache
        try {
            /* eslint-disable */
            const censusCharacter: CharacterWorldOutfitResolved = await this.wsClient.characterManager.fetch(characterId);
            /* eslint-enable */

            // Convert into Character object
            return new Character(censusCharacter);
        } catch (e) {
            await this.wsClient.characterManager.cache.forget(characterId);
            CharacterBroker.logger.warn(`Forgot cache entry for ${characterId}`);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to properly grab character ${characterId} from Census. Error: ${e.message}`, 'CharacterBroker');
        }
    }
}
