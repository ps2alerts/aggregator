import {inject, injectable} from 'inversify';
import {getLogger} from '../logger';
import {FacilityDataBrokerInterface} from '../interfaces/FacilityDataBrokerInterface';
import {Redis} from 'ioredis';
import {CensusEnvironment} from '../types/CensusEnvironment';
import {Zone} from '../constants/zone';
import {FacilityDataInterface} from '../interfaces/FacilityDataInterface';
import FacilityData from '../data/FacilityData';
import FakeMapRegionFactory from '../constants/fakeMapRegion';
import {CensusApiRetryDriver} from '../drivers/CensusApiRetryDriver';
import {RestClient} from 'ps2census/dist/rest';
import {TYPES} from '../constants/types';

@injectable()
export default class FacilityDataBroker implements FacilityDataBrokerInterface {
    private static readonly logger = getLogger('FacilityDataBroker');

    constructor(
        @inject(TYPES.redis) private readonly cacheClient: Redis,
        private readonly restClient: RestClient,
    ) {}

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
            FacilityDataBroker.logger.silly(`facilityData ${cacheKey} cache HIT`);
            const data = await this.cacheClient.get(cacheKey);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            return new FacilityData(JSON.parse(<string>data), zone);
        }

        FacilityDataBroker.logger.silly(`facilityData ${cacheKey} cache MISS`);

        const query = this.restClient.getQueryBuilder('map_region')
            .limit(1);
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const filter = {facility_id: facilityId.toString()};

        // Grab the map region data from Census
        try {
            const apiRequest = new CensusApiRetryDriver(query, filter, 'FacilityDataBroker');
            await apiRequest.try().then(async (facility) => {
                if (!facility || !facility[0] || !facility[0].facility_id) {
                    FacilityDataBroker.logger.error(`[${environment}] Could not find facility ${facilityId} (Zone ${zone}) in Census, or they returned garbage.`);
                    return facilityData;
                }

                FacilityDataBroker.logger.debug(`[${environment}] Facility ID ${facilityId} successfully retrieved from Census`);

                // Cache the response for 24h then return
                await this.cacheClient.setex(cacheKey, 60 * 60 * 24, JSON.stringify(facility[0]));

                FacilityDataBroker.logger.silly(`[${environment}] Facility ID ${facilityId} successfully stored in cache`);
                facilityData = new FacilityData(facility[0], zone);
            });
        } catch (err) {
            if (err instanceof Error) {
                FacilityDataBroker.logger.error(`[${environment}] Unable to properly grab facility ${facilityId} from Census. Error: ${err.message}`);
            }
        }

        return facilityData;
    }
}
