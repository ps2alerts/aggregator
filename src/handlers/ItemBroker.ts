import {inject, injectable} from 'inversify';
import {getLogger} from '../logger';
import {rest} from 'ps2census';
import {ItemBrokerInterface} from '../interfaces/ItemBrokerInterface';
import {ItemInterface} from '../interfaces/ItemInterface';
import Item from '../data/Item';
import FakeItemFactory from '../constants/fakeItem';
import {TYPES} from '../constants/types';
import Census from '../config/census';
import {RedisConnection} from '../services/redis/RedisConnection';
import {Redis as RedisInterface} from 'ioredis';
import {Vehicle} from '../constants/vehicle';
import {CensusEnvironment} from '../types/CensusEnvironment';

@injectable()
export default class ItemBroker implements ItemBrokerInterface {
    private static readonly logger = getLogger('ItemBroker');
    private readonly censusConfig: Census;
    private readonly cacheClient: RedisInterface;

    constructor(
    @inject(TYPES.censusConfig) censusConfig: Census,
        @inject(RedisConnection) cacheClient: RedisConnection,
    ) {
        this.censusConfig = censusConfig;
        this.cacheClient = cacheClient.getClient();
    }

    public async get(
        environment: CensusEnvironment,
        itemId: number,
        vehicleId: Vehicle,
    ): Promise<ItemInterface> {
        if (itemId === 0 || isNaN(itemId) || !itemId) {
            if (!vehicleId) {
                ItemBroker.logger.silly(`[${environment}] Missing item and vehicle ID, serving unknown item weapon`);
                return new FakeItemFactory().build();
            } else {
                ItemBroker.logger.silly('Missing item ID, serving unknown item vehicle');
                return new FakeItemFactory().build(true);
            }
        }

        let returnItem = new FakeItemFactory().build();

        const cacheKey = `item-${itemId}-${environment}`;

        // If in cache, grab it
        if (await this.cacheClient.exists(cacheKey)) {
            ItemBroker.logger.silly(`item ${cacheKey} cache HIT`);
            const data = await this.cacheClient.get(cacheKey);
            return new Item(JSON.parse(<string>data));
        }

        ItemBroker.logger.silly(`item ${cacheKey} cache MISS`);
        const get = rest.getFactory(environment, this.censusConfig.serviceID);

        // Grab the item data from Census
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
                    ItemBroker.logger.error(`[${environment}] Could not find item ${itemId} in Census, or they returned garbage.`);
                    return new FakeItemFactory().build();
                }

                ItemBroker.logger.silly(`[${environment}] Item ID ${itemId} successfully retrieved from Census`);

                // Cache the response for 24h then return
                await this.cacheClient.setex(cacheKey, 60 * 60 * 24, JSON.stringify(item[0]));

                ItemBroker.logger.silly(`[${environment}] Item ID ${itemId} successfully stored in cache`);
                returnItem = new Item(item[0]);
            });
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            ItemBroker.logger.error(`[${environment}] Unable to properly grab item ${itemId} from Census. Error: ${e.message}`);
        }

        return returnItem;
    }
}
