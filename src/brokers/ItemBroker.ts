import {inject, injectable} from 'inversify';
import {getLogger} from '../logger';
import {ItemBrokerInterface} from '../interfaces/ItemBrokerInterface';
import {ItemInterface} from '../interfaces/ItemInterface';
import Item from '../data/Item';
import FakeItemFactory from '../factories/FakeItemFactory';
import {Vehicle} from '../ps2alerts-constants/vehicle';
import {CensusApiRetryDriver} from '../drivers/CensusApiRetryDriver';
import {Redis} from 'ioredis';
import {Rest} from 'ps2census';
import {TYPES} from '../constants/types';
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

        let returnItem = new FakeItemFactory().build();

        const cacheKey = `item-${itemId}-${environment}`;

        // If in cache, grab it
        if (await this.cacheClient.exists(cacheKey)) {
            ItemBroker.logger.silly(`item ${cacheKey} cache HIT`);
            const data = await this.cacheClient.get(cacheKey);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            return new Item(JSON.parse(<string>data));
        }

        ItemBroker.logger.silly(`item ${cacheKey} cache MISS`);

        const query = this.restClient.getQueryBuilder('item')
            .limit(1);
        const filter = {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            item_id: String(itemId),
        };

        // Grab the item data from Census
        try {
            const apiRequest = new CensusApiRetryDriver(query, filter, 'ItemBroker');
            await apiRequest.try().then(async (items) => {
                if (!items) {
                    ItemBroker.logger.error(`[${environment}] Could not find item ${itemId} in Census, or they returned garbage.`);
                    return new FakeItemFactory().build();
                }

                ItemBroker.logger.silly(`[${environment}] Item ID ${itemId} successfully retrieved from Census`);

                // Cache the response for 24h then return
                await this.cacheClient.setex(cacheKey, 60 * 60 * 24, JSON.stringify(items[0]));

                ItemBroker.logger.silly(`[${environment}] Item ID ${itemId} successfully stored in cache`);
                returnItem = new Item(items[0]);
            });
        } catch (err) {
            if (err instanceof Error) {
                ItemBroker.logger.warn(`[${environment}] Unable to properly grab item ${itemId} from Census. Error: ${err.message}`);
            }
        }

        return returnItem;
    }
}