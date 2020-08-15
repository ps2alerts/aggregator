import {RedisConnection} from '../services/redis/RedisConnection';
import {inject, injectable} from 'inversify';
import {rest, Client} from 'ps2census';
import Character from '../data/Character';
import {Redis} from 'ioredis';
import {CharacterBrokerInterface} from '../interfaces/CharacterBrokerInterface';
import {getLogger} from '../logger';

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

    public async get(characterId: string): Promise<Character|null> {
        if (characterId === '0' || !characterId) {
            return null;
        }

        // Grab the character data from Census / Cache
        try {
            /* eslint-disable */
            const censusCharacter: rest.character.typeData = await this.wsClient.characterManager.fetch(characterId);
            /* eslint-enable */

            // Convert into Character object
            return new Character(censusCharacter);
        } catch (e) {
            CharacterBroker.logger.error(`Unable to grab character ${characterId} from Census - may not exist!`);
            return null;
        }
    }
}
