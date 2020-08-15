import {RedisConnection} from '../services/redis/RedisConnection';
import {inject, injectable} from 'inversify';
import {rest, Client} from 'ps2census';
import Character from '../data/Character';
import {Redis} from 'ioredis';
import ApplicationException from '../exceptions/ApplicationException';
import {CharacterBrokerInterface} from '../interfaces/CharacterBrokerInterface';

@injectable()
export default class CharacterBroker implements CharacterBrokerInterface {
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
        // Grab the character data from Census / Cache
        /* eslint-disable */
        const censusCharacter: rest.character.typeData = await this.wsClient.characterManager.fetch(characterId);
        /* eslint-enable */

        if (!censusCharacter.character_id) {
            throw new ApplicationException(`Attempted to get non-existent character ID ${characterId}, this should not be possible!`, 'CharacterBroker');
        }

        // Convert into Character object
        return new Character(censusCharacter);
    }
}
