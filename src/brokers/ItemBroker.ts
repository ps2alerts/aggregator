import {inject, injectable} from 'inversify';
import {getLogger} from '../logger';
import {TYPES} from '../constants/types';
import {ItemBrokerInterface} from '../interfaces/ItemBrokerInterface';
import {ItemInterface} from '../interfaces/ItemInterface';
import Item from '../data/Item';
import FakeItemFactory from '../factories/FakeItemFactory';
import {Vehicle} from '../ps2alerts-constants/vehicle';
import {CensusApiRetryDriver} from '../drivers/CensusApiRetryDriver';
import {Redis} from 'ioredis';
import {Rest} from 'ps2census';
import config from '../config';

@injectable()
export default class ItemBroker implements ItemBrokerInterface {
    private static readonly logger = getLogger('ItemBroker');

    constructor(
        private readonly restClient: Rest.Client,
        @inject(TYPES.redis) private readonly cacheClient: Redis,
    ) {}

    public async get(
        itemId: number,
        vehicleId: Vehicle,
    ): Promise<ItemInterface> {
        const environment = config.census.censusEnvironment;

        if (itemId === 0 || isNaN(itemId) || !itemId) {
            if (!vehicleId) {
                ItemBroker.logger.silly(`[${environment}] Missing item and vehicle ID, serving unknown item weapon`);
                return new FakeItemFactory().build();
            } else {
                ItemBroker.logger.silly('Missing item ID, serving unknown item vehicle');
                return new FakeItemFactory().build(true);
            }
        }

        const cacheKey = `item-${itemId}-${environment}`;

        // If in cache, grab it
        if (await this.cacheClient.exists(cacheKey)) {
            ItemBroker.logger.silly(`item ${cacheKey} cache HIT`);
            const data = await this.cacheClient.get(cacheKey);

            // Check if we've actually got valid JSON in the key
            try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                return new Item(JSON.parse(<string>data));
            } catch (err) {
                // Json didn't parse, chuck the data
                ItemBroker.logger.warn(`Item cache ${cacheKey} was invalid JSON, flushing cache`);

                await this.cacheClient.del(cacheKey);
                // Fall through to the rest of the method to get the item
            }
        }

        ItemBroker.logger.silly(`item ${cacheKey} cache MISS`);

        const item = await this.getItem(itemId, environment);

        // Cache the response for 24h then return
        await this.cacheClient.setex(cacheKey, 60 * 60 * 24, JSON.stringify(item));

        return item;
    }

    private async getItem(itemId: number, environment: string): Promise<ItemInterface> {
        let returnItem = new FakeItemFactory().build();

        const query = this.restClient.getQueryBuilder('item')
            .limit(1);
        const filter = {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            item_id: String(itemId),
        };

        // Grab the item data from Census
        try {
            const apiRequest = new CensusApiRetryDriver(query, filter, 'ItemBroker');
            await apiRequest.try().then((items) => {
                if (!items || !items.length) {
                    ItemBroker.logger.warn(`[${environment}] Could not find item ${itemId} in Census, or they returned garbage.`);
                    return new FakeItemFactory().build();
                }

                returnItem = new Item(items[0]);
            });
        } catch (err) {
            if (err instanceof Error) {
                ItemBroker.logger.warn(`[${environment}] Unable to properly grab item ${itemId} from Census. Error: ${err.message}`);
            }
        }

        // Log the unknown item so we can investigate
        await this.cacheClient.sadd(config.redis.unknownItemKey, itemId);
        ItemBroker.logger.debug(`Unknown item ${itemId} logged`);

        // Returns fake
        ItemBroker.logger.warn(`[${environment}] Returning fake item in response for item ${itemId}`);
        return returnItem;
    }
}
