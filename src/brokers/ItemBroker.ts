/* eslint-disable @typescript-eslint/naming-convention */
import {inject, injectable} from 'inversify';
import {getLogger} from '../logger';
import {TYPES} from '../constants/types';
import {ItemBrokerInterface} from '../interfaces/ItemBrokerInterface';
import {ItemInterface} from '../interfaces/ItemInterface';
import Item from '../data/Item';
import FakeItemFactory from '../factories/FakeItemFactory';
import {Vehicle} from '../ps2alerts-constants/vehicle';
import {CensusApiRetryDriver} from '../drivers/CensusApiRetryDriver';
import {Rest} from 'ps2census';
import config from '../config';
import {AxiosInstance} from 'axios';
import ApplicationException from '../exceptions/ApplicationException';
import {lithafalconEndpoints} from '../ps2alerts-constants/lithafalconEndpoints';
import {CensusEnvironment} from '../types/CensusEnvironment';
import Redis from 'ioredis';
import StatisticsHandler, {MetricTypes} from '../handlers/StatisticsHandler';

@injectable()
export default class ItemBroker implements ItemBrokerInterface {
    private static readonly logger = getLogger('ItemBroker');

    constructor(
        private readonly restClient: Rest.Client,
        private readonly cacheClient: Redis,
        @inject(TYPES.falconApiClient) private readonly falconApiClient: AxiosInstance,
        private readonly timingStatisticsHandler: StatisticsHandler,
    ) {}

    public async get(
        itemId: number,
        vehicleId: Vehicle,
    ): Promise<ItemInterface> {
        const environment: CensusEnvironment = config.census.censusEnvironment;

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

        ItemBroker.logger.debug(`item ${cacheKey} cache MISS`);

        // Serve the fake item by default, if one is found it gets replaced
        let item = new FakeItemFactory().build();

        const censusItem = await this.getItemFromCensus(itemId, environment);

        if (censusItem) {
            ItemBroker.logger.silly(`[${environment}] Census API found item ${itemId}!`);
            item = censusItem;
        }

        if (environment === 'ps2' && !censusItem) {
            const falconItem = await this.getItemFromFalcon(itemId, environment);

            if (falconItem) {
                ItemBroker.logger.silly(`[${environment}] Falcon API found item ${itemId}!`);
                item = falconItem;
            }
        }

        if (item.id === -1) {
            // Log the unknown item so we can investigate
            await this.cacheClient.sadd(config.redis.unknownItemKey, itemId);
            ItemBroker.logger.debug(`Unknown item ${itemId} logged`);

            // Returns fake
            ItemBroker.logger.warn(`[${environment}] Returning fake item in response for item ${itemId}`);
        }

        // Cache the response for 24h then return
        // Item needs to be converted back into a CensusItem interface and stored as such
        const rawCensusItem = {
            item_id: String(item.id),
            name: {
                en: item.name,
            },
            faction_id: item.faction,
            item_category_id: String(item.categoryId),
            is_vehicle_weapon: String(item.isVehicleWeapon),
        };

        await this.cacheClient.setex(cacheKey, 60 * 60 * 24, JSON.stringify(rawCensusItem));
        await this.cacheClient.sadd(config.redis.itemCacheListKey, cacheKey); // Store the cache key by name so we can wipe it manually

        return item;
    }

    private async getItemFromCensus(itemId: number, environment: CensusEnvironment): Promise<ItemInterface | null> {
        const query = this.restClient.getQueryBuilder('item')
            .limit(1);
        const filter = {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            item_id: String(itemId),
        };

        // Grab the item data from Census
        try {
            const apiRequest = new CensusApiRetryDriver(query, filter, 'ItemBroker');
            const started = new Date();
            await apiRequest.try().then(async (items) => {
                if (!items?.length) {
                    ItemBroker.logger.warn(`[${environment}] Could not find item ${itemId} in Census, or they returned garbage.`);
                    return null;
                }

                await this.timingStatisticsHandler.logTime(started, MetricTypes.CENSUS_ITEM);

                return new Item(items[0]);
            });
        } catch (err) {
            if (err instanceof Error) {
                ItemBroker.logger.warn(`[${environment}] Unable to properly grab item ${itemId} from Census. Error: ${err.message}`);
                return null;
            }
        }

        return null;
    }

    private async getItemFromFalcon(itemId: number, environment: CensusEnvironment): Promise<ItemInterface> {
        const returnItem = new FakeItemFactory().build();

        if (environment !== 'ps2') {
            return returnItem;
        }

        // Grab the item data from Census
        try {
            const request = await this.falconApiClient.get(lithafalconEndpoints.itemId, {
                params: {
                    item_id: itemId,
                },
            });

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
            const data: Rest.Format<'item'> = request.data.item_list[0];
            return new Item(data);
        } catch (err) {
            if (err instanceof Error) {
                ItemBroker.logger.warn(`[${environment}] Unable to properly grab item ${itemId} from Falcon API. Error: ${err.message}`);
                throw new ApplicationException('Falcon API could not find item');
            }
        }

        return returnItem;
    }
}
