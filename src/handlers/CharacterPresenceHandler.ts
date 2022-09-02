import {injectable} from 'inversify';
import {getLogger} from '../logger';
import CharacterPresenceHandlerInterface from '../interfaces/CharacterPresenceHandlerInterface';
import PopulationData from '../data/PopulationData';
import {Faction, factionArray} from '../ps2alerts-constants/faction';
import Character from '../data/Character';
import {World, worldArray} from '../ps2alerts-constants/world';
import FactionUtils from '../utils/FactionUtils';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import Redis from 'ioredis';
import {Ps2AlertsEventType} from '../ps2alerts-constants/ps2AlertsEventType';
import OutfitWarsTerritoryInstance from '../instances/OutfitWarsTerritoryInstance';
import ApplicationException from '../exceptions/ApplicationException';

@injectable()
export default class CharacterPresenceHandler implements CharacterPresenceHandlerInterface {
    private static readonly logger = getLogger('CharacterPresenceHandler');

    constructor(private readonly cacheClient: Redis) {}

    // Updates / adds characters presence, setting a Redis key with expiry.
    public async update(character: Character, instance: PS2AlertsInstanceInterface): Promise<boolean> {
        // If OutfitWars, change instance zone to be the zoneID
        let zone: number;

        if (instance.ps2AlertsEventType === Ps2AlertsEventType.LIVE_METAGAME) {
            zone = instance.zone;
        } else {
            const instanceGhost = instance as OutfitWarsTerritoryInstance;
            zone = instanceGhost.zoneInstanceId;
        }

        // Add character as its own key which will eventually expire, with the zone of the character
        await this.cacheClient.setex(`CharacterPresence-${character.id}`, 60 * 5, zone);

        // Add character to overall redis set to be scanned later split by world and faction
        const listName = `CharacterPresencePops-${instance.world}-${character.teamId}`;
        await this.cacheClient.sadd(listName, character.id);

        // Add list to global list, so they can all be cleared up upon start of aggregator
        await this.cacheClient.sadd('CharacterPresenceLists', listName);

        return true;
    }

    // Calculate the current characters, their worlds / zones and return that back as a series of objects separated by world and zone.
    public async collate(): Promise<Map<string, PopulationData>> {
        const populationDataMap: Map<string, PopulationData> = new Map<string, PopulationData>();

        CharacterPresenceHandler.logger.debug('Running character presence collation');

        // Scan through each world and each faction to get the count from the set
        for (const world of worldArray) {
            for (const faction of factionArray) {
                const characters = await this.getCharacterList(world, faction);

                if (characters.length === 0) {
                    continue;
                }

                // Loop characters to get zones
                // eslint-disable-next-line @typescript-eslint/no-for-in-array
                for (const index in characters) {
                    const key = `CharacterPresence-${characters[index]}`;
                    const characterZone = await this.cacheClient.get(key);
                    const zone = characterZone ? parseInt(characterZone, 10) : 0; // Which zone is the value of the character
                    const mapKey = `${world}-${zone}`;

                    // If zone isn't initialized, set it now
                    if (!populationDataMap.has(mapKey)) {
                        populationDataMap.set(mapKey, {
                            world,
                            zone,
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
                        throw new ApplicationException('Faction.NONE was returned for Populations!');
                    }

                    const factionCount = zoneRecord[factionKey];
                    const newFactionCount = factionCount + 1;

                    // Create a new clone of the zonePops, as it is apparently read only and cannot be changed
                    const newZonePops = {
                        world,
                        zone,
                        vs: zoneRecord.vs,
                        nc: zoneRecord.nc,
                        tr: zoneRecord.tr,
                        nso: zoneRecord.nso,
                        total: zoneRecord.total + 1,
                    };
                    newZonePops[factionKey] = newFactionCount;

                    populationDataMap.set(mapKey, newZonePops);
                }
            }
        }

        if (CharacterPresenceHandler.logger.isSillyEnabled()) {
            console.log(populationDataMap);
        }

        return populationDataMap;
    }

    public async flushLists(): Promise<void> {
        CharacterPresenceHandler.logger.info('Flushing character presence lists ', 'CharacterPresenceHandler');

        const instanceLists = await this.cacheClient.smembers('CharacterPresenceLists');

        // eslint-disable-next-line @typescript-eslint/no-for-in-array
        for (const index in instanceLists) {
            const list = instanceLists[index];
            await this.cacheClient.del(list);
            CharacterPresenceHandler.logger.debug(`Deleted ${list}`, 'CharacterPresenceHandler');
        }

        // Delete the list itself
        await this.cacheClient.del('CharacterPresenceLists');
    }

    private async getCharacterList(world: World, faction: Faction): Promise<string[]> {
        let changes = false;
        const listName = `CharacterPresencePops-${world}-${faction}`;
        const chars = await this.cacheClient.smembers(listName);

        // For each character, loop through and check if they still exist in Redis, which is based off an expiry.
        // If they don't, they're inactive, so we'll delete them out of the set.
        // eslint-disable-next-line @typescript-eslint/no-for-in-array
        for (const char in chars) {
            const exists = await this.cacheClient.exists(`CharacterPresence-${chars[char]}`);

            if (!exists) {
                CharacterPresenceHandler.logger.silly(`Removing stale char ${chars[char]} from set listName`);
                await this.cacheClient.srem(listName, chars[char]);
                changes = true;
            }
        }

        // Since the above list has been changed, we'll return the characters again.
        if (changes) {
            return await this.cacheClient.smembers(listName);
        }

        return chars;
    }
}
