import {Injectable, Logger} from '@nestjs/common';
import PopulationData from '../data/PopulationData';
import {Faction} from '../ps2alerts-constants/faction';
import Character from '../data/Character';
import {World} from '../ps2alerts-constants/world';
import FactionUtils from '../utils/FactionUtils';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import Redis from 'ioredis';
import ApplicationException from '../exceptions/ApplicationException';
import config from '../config';

interface PresenceData {
    world: World;
    zone: number;
    faction: Faction;
    instanceId: string;
    charId: string;
}

@Injectable()
export default class CharacterPresenceHandler {
    private static readonly logger = new Logger('CharacterPresenceHandler');

    private readonly charListName = 'CharacterPresenceList';
    private readonly charKeyPrefix = 'CharacterPresence';

    constructor(private readonly cacheClient: Redis) {}

    // Updates / adds characters presence, setting a Redis key with expiry.
    public async update(character: Character, instance: PS2AlertsInstanceInterface): Promise<boolean> {
        const data: PresenceData = {
            world: instance.world,
            zone: instance.zone,
            instanceId: instance.instanceId,
            faction: character.teamId,
            charId: character.id,
        };

        // Add character as its own key which will eventually expire, with the zone of the character
        await this.cacheClient.setex(`${this.charKeyPrefix}-${character.id}`, 60 * 5, JSON.stringify(data));

        // Add character to overall redis set to be scanned later split by world and faction
        await this.cacheClient.sadd(this.charListName, character.id);

        return true;
    }

    // Calculate the current characters, their worlds / zones and return that back as a series of objects separated by world and zone.
    public async collate(): Promise<Map<string, PopulationData> | null> {
        const populationDataMap: Map<string, PopulationData> = new Map<string, PopulationData>();
        CharacterPresenceHandler.logger.debug('Running character presence collation');

        // Check for instances
        const instances = await this.cacheClient.smembers('ActiveInstances');

        if (!instances.length) {
            CharacterPresenceHandler.logger.debug('No instances running, aborting collection');
            return null;
        }

        // Scan through each world and each faction to get the count from the set
        const characters = await this.getCharactersFromList();

        if (characters.length === 0) {
            throw new ApplicationException('No characters for population! Is Collector running or continent has locked?');
        }

        // Loop characters to get zones
        // eslint-disable-next-line @typescript-eslint/no-for-in-array
        for (const index in characters) {
            const key = `${this.charKeyPrefix}-${characters[index]}`;
            const presenceDataString = await this.cacheClient.get(key);

            if (!presenceDataString) {
                CharacterPresenceHandler.logger.debug(`Presence data for ${key} doesn't actually exist, skipping!`);
                continue;
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const presenceData: PresenceData = JSON.parse(presenceDataString);

            // Why we can't use these directly in the .set I do not know
            const world = presenceData.world;
            const zone = presenceData.zone;
            const instanceId = presenceData.instanceId;
            const faction = presenceData.faction;

            const mapKey = `${world}-${zone}-${instanceId}`;

            // If zone isn't initialized, set it now
            if (!populationDataMap.has(mapKey)) {
                populationDataMap.set(mapKey, {
                    world,
                    zone,
                    instanceId,
                    vs: 0,
                    nc: 0,
                    tr: 0,
                    nso: 0,
                    total: 0,
                });
            }

            // Get zone record
            const zoneRecord = populationDataMap.get(mapKey);

            if (!zoneRecord) {
                throw new ApplicationException('No zoneRecord could be found despite it just being set!');
            }

            // Get faction count
            const factionKey = FactionUtils.parseFactionIdToShortName(faction) ?? Faction.NONE;

            if (factionKey === 'none') {
                CharacterPresenceHandler.logger.error(`Faction.NONE was returned for character ${presenceData.charId}, index: ${index}. Nuking bad data...`);
                await this.cacheClient.del(key);
                continue;
            }

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const factionCount: number = zoneRecord[factionKey];
            const newFactionCount = factionCount + 1;

            // Create a new clone of the zonePops, as it is apparently read only and cannot be changed
            const newZonePops = {
                world,
                zone,
                instanceId,
                vs: zoneRecord.vs,
                nc: zoneRecord.nc,
                tr: zoneRecord.tr,
                nso: zoneRecord.nso,
                total: zoneRecord.total + 1,
            };
            newZonePops[factionKey] = newFactionCount;

            populationDataMap.set(mapKey, newZonePops);
        }

        if (config.logger.silly) {
            console.log(populationDataMap);
        }

        return populationDataMap;
    }

    private async getCharactersFromList(): Promise<string[]> {
        let changes = false;

        const chars = await this.cacheClient.smembers(this.charListName);

        // For each character, loop through and check if they still exist in Redis, which is based off an expiry.
        // If they don't, they're inactive, so we'll delete them out of the set.
        // eslint-disable-next-line @typescript-eslint/no-for-in-array
        for (const index in chars) {
            const characterRef = chars[index];
            const exists = await this.cacheClient.exists(`${this.charKeyPrefix}-${characterRef}`);

            if (!exists) {
                CharacterPresenceHandler.logger.verbose(`Removing stale char ${characterRef} from set listName`);
                await this.cacheClient.srem(this.charListName, characterRef);
                changes = true;
            }
        }

        // Since the above list has been changed, we'll return the characters again.
        if (changes) {
            return this.cacheClient.smembers(this.charListName);
        }

        return chars;
    }
}
