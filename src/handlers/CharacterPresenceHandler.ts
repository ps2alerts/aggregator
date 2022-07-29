import {injectable} from 'inversify';
import {Zone, zoneArray} from '../ps2alerts-constants/zone';
import {getLogger} from '../logger';
import CharacterPresenceHandlerInterface from '../interfaces/CharacterPresenceHandlerInterface';
import PopulationData from '../data/PopulationData';
import {Faction, factionArray} from '../ps2alerts-constants/faction';
import Character from '../data/Character';
import {World, worldArray} from '../ps2alerts-constants/world';
import FactionUtils from '../utils/FactionUtils';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import Redis from 'ioredis';

@injectable()
export default class CharacterPresenceHandler implements CharacterPresenceHandlerInterface {
    private static readonly logger = getLogger('CharacterPresenceHandler');

    constructor(private readonly cacheClient: Redis) {}

    // Updates / adds characters presence, setting a Redis key with expiry.
    public async update(character: Character, instance: PS2AlertsInstanceInterface): Promise<boolean> {
        // Add character to overall Redis collection to control expiry.
        await this.cacheClient.setex(`CharacterPresence-${character.id}`, 60 * 5, 'foo');

        // Add character to Redis set based on World, Zone and Faction.
        await this.cacheClient.sadd(`CharacterPresencePops-${instance.world}-${instance.zone}-${character.faction}`, character.id);

        return true;
    }

    // Deletes characters out of Redis and the Redis Set.
    public async delete(character: Character): Promise<boolean> {
        // Delete character out of Redis
        await this.cacheClient.del(`CharacterPresence-${character.id}`);

        // If the character is a member of any Redis sets, remove them from the sets.
        for (const zone of zoneArray) {
            await this.cacheClient.srem(`CharacterPresencePops-${character.world}-${zone}-${character.faction}`, character.id);
        }

        CharacterPresenceHandler.logger.silly(`Deleted CharacterPresence cache entry for char ${character.id}`, 'CharacterPresenceHandler');

        return true;
    }

    // Calculate the current characters, their worlds / zones and return that back as a series of objects separated by world and zone.
    public async collate(): Promise<Map<string, PopulationData>> {
        const populationData: Map<string, PopulationData> = new Map<string, PopulationData>();

        CharacterPresenceHandler.logger.debug('Running character presence collation');

        // Scan through each world, each zone and each faction to get the count from the set.
        for (const world of worldArray) {
            for (const zone of zoneArray) {
                let total = 0;
                const mapKey = `${world}-${zone}`;

                for (const faction of factionArray) {
                    const chars = await this.getCharacterList(world, zone, faction);

                    // If there are no characters, don't bother.
                    if (chars.length === 0) {
                        continue;
                    }

                    total += chars.length;

                    // If this is the first run for the world / zone, make a empty PopulationData entry.
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

        if (CharacterPresenceHandler.logger.isSillyEnabled()) {
            // Using console here rather than the normal logger - it wasn't spitting out stuff the way I wanted. This is only for debug anyway so it won't show up in prod logs.
            console.log(populationData);
        }

        return populationData;
    }

    private async getCharacterList(world: World, zone: Zone, faction: Faction): Promise<string[]> {
        let changes = false;
        const chars = await this.cacheClient.smembers(`CharacterPresencePops-${world}-${zone}-${faction}`);

        // For each character, loop through and check if they still exist in Redis, which is based off an expiry.
        // If they don't, they're inactive, so we'll delete them out of the set.
        // eslint-disable-next-line @typescript-eslint/no-for-in-array
        for (const char in chars) {
            const exists = await this.cacheClient.exists(`CharacterPresence-${chars[char]}`);

            if (!exists) {
                CharacterPresenceHandler.logger.silly(`Removing stale char ${chars[char]} from set CharacterPresencePops-${world}-${zone}-${faction}`);
                await this.cacheClient.srem(`CharacterPresencePops-${world}-${zone}-${faction}`, chars[char]);
                changes = true;
            }
        }

        // Since the above list has been changed, we'll return the characters again.
        if (changes) {
            return await this.cacheClient.smembers(`CharacterPresencePops-${world}-${zone}-${faction}`);
        }

        return chars;
    }
}
