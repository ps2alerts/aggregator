import {inject, injectable} from 'inversify';
import {getLogger} from '../logger';
import {Client, rest} from 'ps2census';
import {ItemBrokerInterface} from '../interfaces/ItemBrokerInterface';
import {ItemInterface} from '../interfaces/ItemInterface';
import Item from '../data/Item';
import FakeItemFactory from '../constants/fakeItem';
import {TYPES} from '../constants/types';
import Census from '../config/census';
import {RedisConnection} from '../services/redis/RedisConnection';
import {Redis as RedisInterface} from 'ioredis';

@injectable()
export default class ItemBroker implements ItemBrokerInterface {
    private static readonly logger = getLogger('ItemBroker');
    private readonly wsClient: Client;
    private readonly censusConfig: Census;
    private readonly cacheClient: RedisInterface;

    constructor(
    @inject(Client) wsClient: Client,
        @inject(TYPES.censusConfig) censusConfig: Census,
        @inject(RedisConnection) cacheClient: RedisConnection,
    ) {
        this.wsClient = wsClient;
        this.censusConfig = censusConfig;
        this.cacheClient = cacheClient.getClient();
    }

    public async get(itemId: number): Promise<ItemInterface> {
        let returnItem = new FakeItemFactory().build();

        if (itemId === 0 || isNaN(itemId) || !itemId) {
            ItemBroker.logger.silly('Missing item ID, serving unknown item');
            return returnItem;
        }

        const cacheKey = `item-${itemId}`;

        // If in cache, grab it
        if (await this.cacheClient.exists(cacheKey)) {
            ItemBroker.logger.silly(`Item ID ${itemId} cache HIT`);
            const data = await this.cacheClient.get(cacheKey);
            return new Item(JSON.parse(<string>data));
        }

        ItemBroker.logger.silly(`Item ID ${itemId} cache MISS`);
        const get = rest.getFactory('ps2', this.censusConfig.serviceID);

        // Grab the character data from Census
        try {
            await get(
                rest.limit(
                    rest.item,
                    1,
                ),
                // eslint-disable-next-line @typescript-eslint/naming-convention
                {item_id: itemId.toString()},
            ).then(async (item) => {
                if (!item || !item[0] || !item[0].item_id) {
                    ItemBroker.logger.error(`Could not find item ${itemId} in Census, or they returned garbage.`);
                    return new FakeItemFactory().build();
                }

                ItemBroker.logger.debug(`Item ID ${itemId} successfully retrieved from Census`);

                // Cache the response for 24h then return
                await this.cacheClient.setex(cacheKey, 60 * 60 * 24, JSON.stringify(item[0]));

                ItemBroker.logger.debug(`Item ID ${itemId} successfully stored in cache`);
                returnItem = new Item(item[0]);
            });
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            ItemBroker.logger.error(`Unable to properly grab item ${itemId} from Census. Error: ${e.message}`);
        }

        return returnItem;
    }
}
