import {inject, injectable} from 'inversify';
import {getLogger} from '../logger';
import {rest} from 'ps2census';
import {FacilityDataBrokerInterface} from '../interfaces/FacilityDataBrokerInterface';
import {TYPES} from '../constants/types';
import Census from '../config/census';
import {RedisConnection} from '../services/redis/RedisConnection';
import {Redis as RedisInterface} from 'ioredis';
import {CensusEnvironment} from '../types/CensusEnvironment';
import {Zone} from '../constants/zone';
import {FacilityDataInterface} from '../interfaces/FacilityDataInterface';
import FacilityData from '../data/FacilityData';
import FakeMapRegionFactory from '../constants/fakeMapRegion';

@injectable()
export default class FacilityDataBroker implements FacilityDataBrokerInterface {
    private static readonly logger = getLogger('FacilityDataBroker');
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
        facilityId: number,
        zone: Zone,
    ): Promise<FacilityDataInterface> {
        const cacheKey = `facility-${facilityId}-${environment}`;

        let facilityData = new FakeMapRegionFactory().build(facilityId);

        // If FacilityID is greater than reasonable, return fake facility. This is to eliminate dynamic tutorial zones
        if (facilityId > 999999) {
            return facilityData;
        }

        // If in cache, grab it
        if (await this.cacheClient.exists(cacheKey)) {
            FacilityDataBroker.logger.debug(`facilityData ${cacheKey} cache HIT`);
            const data = await this.cacheClient.get(cacheKey);
            return new FacilityData(JSON.parse(<string>data), zone);
        }

        FacilityDataBroker.logger.debug(`facilityData ${cacheKey} cache MISS`);
        const get = rest.getFactory(environment, this.censusConfig.serviceID);

        // Grab the map region data from Census
        try {
            await get(
                rest.limit(
                    rest.mapRegion,
                    1,
                ),
                // eslint-disable-next-line @typescript-eslint/naming-convention
                {facility_id: facilityId.toString()},
            ).then(async (facility) => {
                if (!facility || !facility[0] || !facility[0].facility_id) {
                    FacilityDataBroker.logger.error(`[${environment}] Could not find facility ${facilityId} (Zone ${zone}) in Census, or they returned garbage.`);
                    return facilityData;
                }

                FacilityDataBroker.logger.silly(`[${environment}] Facility ID ${facilityId} successfully retrieved from Census`);

                // Cache the response for 24h then return
                await this.cacheClient.setex(cacheKey, 60 * 60 * 24, JSON.stringify(facility[0]));

                FacilityDataBroker.logger.silly(`[${environment}] Facility ID ${facilityId} successfully stored in cache`);
                facilityData = new FacilityData(facility[0], zone);
            });
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            FacilityDataBroker.logger.error(`[${environment}] Unable to properly grab facility ${facilityId} from Census. Error: ${e.message}`);
        }

        return facilityData;
    }
}
