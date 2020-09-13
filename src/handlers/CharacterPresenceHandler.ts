import {inject, injectable} from 'inversify';
import {Zone, zoneArray} from '../constants/zone';
import {getLogger} from '../logger';
import CharacterPresenceHandlerInterface from '../interfaces/CharacterPresenceHandlerInterface';
import PopulationData from '../data/PopulationData';
import {factionArray} from '../constants/faction';
import Character from '../data/Character';
import {RedisConnection} from '../services/redis/RedisConnection';
import {Redis} from 'ioredis';
import {worldArray} from '../constants/world';
import FactionUtils from '../utils/FactionUtils';

@injectable()
export default class CharacterPresenceHandler implements CharacterPresenceHandlerInterface {
    private static readonly logger = getLogger('CharacterPresenceHandler');
    private readonly cache: Redis;

    constructor(
    @inject(RedisConnection) cacheClient: RedisConnection,
    ) {
        this.cache = cacheClient.getClient();
    }

    public async update(character: Character, zone: number): Promise<boolean> {
        // Handle Sanctuary / unrecognised zones here
        if (!Object.values(Zone).includes(zone)) {
            CharacterPresenceHandler.logger.silly(`Discarding CharacterPresence update, unrecognized zone: ${zone}`);
            return true;
        }

        // Add character to overall redis collection to control expiry
        await this.cache.setex(`CharacterPresence-${character.id}`, 60 * 5, 'foo');

        // Add character to Redis set based on World, Zone and Faction
        await this.cache.sadd(`CharacterPresencePops-${character.world}-${zone}-${character.faction}`, character.id);

        return true;
    }

    public async delete(character: Character): Promise<boolean> {
        // Delete character out of Redis
        await this.cache.del(`CharacterPresence-${character.id}`);

        // If the character is a member of any sets, scan the world zones and remove them
        for (const zone of zoneArray) {
            await this.cache.srem(`CharacterPresencePops-${character.world}-${zone}-${character.faction}`, character.id);
        }

        CharacterPresenceHandler.logger.silly(`Forcefully deleted CharacterPresence cache entry for char ${character.id}`, 'CharacterPresenceHandler');

        return true;
    }

    // Calculate the current characters, their worlds / zones and return that back as a series of objects separated by world and zone
    public async collate(): Promise<Map<string, PopulationData>> {
        const populationData: Map<string, PopulationData> = new Map<string, PopulationData>();

        // Scan through each world, each zone, each faction and get the count from the list, then flush Redis sets.
        for (const world of worldArray) {
            for (const zone of zoneArray) {
                let total = 0;
                const mapKey = `${world}-${zone}`;

                for (const faction of factionArray) {
                    const chars = await this.cache.smembers(`CharacterPresencePops-${world}-${zone}-${faction}`);

                    // For each character, loop through and check if they still exist in Redis, which is based off a timer.
                    // If they don't, we're regarding them as inactive so we'll delete them out of the set.
                    // eslint-disable-next-line @typescript-eslint/no-for-in-array
                    for (const char in chars) {
                        const exists = await this.cache.exists(`CharacterPresence-${chars[char]}`);

                        if (!exists) {
                            CharacterPresenceHandler.logger.silly(`Removing stale char ${chars[char]} from set CharacterPresencePops-${world}-${zone}-${faction}`);
                            await this.cache.srem(`CharacterPresencePops-${world}-${zone}-${faction}`, chars[char]);
                        }
                    }

                    // If there are no characters, don't bother
                    if (chars.length === 0) {
                        continue;
                    }

                    total += chars.length;

                    if (!populationData.has(mapKey)) {
                        populationData.set(mapKey, new PopulationData(
                            world,
                            zone,
                            0,
                            0,
                            0,
                            0,
                            0,
                        ));
                    }

                    const map = populationData.get(mapKey);

                    if (map) {
                        const factionShortKey = FactionUtils.parseFactionIdToShortName(faction);
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        map[factionShortKey] = chars.length;
                        populationData.set(mapKey, map);
                    }
                }

                // Update totals
                const map = populationData.get(mapKey);

                if (map) {
                    map.total = total;
                    populationData.set(mapKey, map);
                }
            }
        }

        CharacterPresenceHandler.logger.debug('==== Population Metrics ====');

        if (CharacterPresenceHandler.logger.isDebugEnabled()) {
            // eslint-disable-next-line no-console
            console.log(populationData);
        }

        CharacterPresenceHandler.logger.debug('==== End Population Metrics ====');

        return populationData;
    }
}
