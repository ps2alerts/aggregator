import {inject, injectable} from 'inversify';
import {World} from '../constants/world';
import {Zone} from '../constants/zone';
import CharacterData from '../data/CharacterData';
import {getLogger} from '../logger';
import CharacterPresenceHandlerInterface from '../interfaces/CharacterPresenceHandlerInterface';
import PopulationData from '../data/PopulationData';
import {Faction} from '../constants/faction';
import {jsonLogOutput} from '../utils/json';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import {CharacterPresenceSchemaInterface} from '../models/CharacterPresenceModel';
import {TYPES} from '../constants/types';
import ApplicationException from '../exceptions/ApplicationException';
import {TestCharacters} from '../constants/testCharacters';

@injectable()
export default class CharacterPresenceHandler implements CharacterPresenceHandlerInterface {
    private static readonly logger = getLogger('CharacterPresenceHandler');

    private readonly characters: Map<string, CharacterData> = new Map<string, CharacterData>();

    private readonly factory: MongooseModelFactory<CharacterPresenceSchemaInterface>;

    private readonly initialized = false;

    private flushTimer: NodeJS.Timeout|null = null;

    constructor(@inject(TYPES.characterPresenceFactory) factory: MongooseModelFactory<CharacterPresenceSchemaInterface>) {
        this.factory = factory;
    }

    public async update(characterId: string, world: World, zone: number|null = null): Promise<boolean> {
        // Handle Sanctuary / unrecognised zones here
        if (zone && !Object.values(Zone).includes(zone)) {
            CharacterPresenceHandler.logger.debug(`Discarding CharacterPresence update, unrecognized zone: ${zone}`);
            return true;
        }

        const faction = Math.floor(Math.random() * 4) + 1; // TODO API CALL TO FIGURE THIS OUT

        const characterData = new CharacterData(
            characterId,
            world,
            zone,
            faction,
            new Date(),
        );

        const alreadyExists = this.characters.has(characterId);

        this.characters.set(characterId, characterData);

        if (!alreadyExists) {
            try {
                await this.factory.model.create({
                    character: characterData.character,
                    world: characterData.world,
                    zone: characterData.zone,
                    faction: characterData.faction,
                    lastSeen: characterData.lastSeen,
                });
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`Error creating character presence entry! Char: ${characterId} - E: ${err}`, 'CharacterPresenceHandler');
            }

            if (characterData.character === TestCharacters.MAELSTROME26) {
                CharacterPresenceHandler.logger.debug(`Created CharacterPresenceHandler record for Char: ${characterId} - ${jsonLogOutput(characterData)}`);
            }
        } else {
            try {
                await this.factory.model.update({
                    character: characterData.character,
                }, {
                    lastSeen: characterData.lastSeen,
                });
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`Error updating character presence entry! Char: ${characterId} - E: ${err}`, 'CharacterPresenceHandler');
            }

            if (characterData.character === TestCharacters.MAELSTROME26) {
                CharacterPresenceHandler.logger.debug(`Updated CharacterPresenceHandler record for Char: ${characterId} - ${jsonLogOutput(characterData)}`);
            }
        }

        return true;
    }

    public async delete(characterId: string): Promise<boolean> {
        if (this.characters.has(characterId)) {
            this.characters.delete(characterId);

            try {
                await this.factory.model.deleteMany({
                    character: characterId,
                });
                CharacterPresenceHandler.logger.debug(`Deleted CharacterPresenceHandler record for Char ${characterId}`);
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`Error creating CharacterPresenceHandler record for Char: ${characterId} - E: ${err}`, 'CharacterPresenceHandler');
            }

            return true;
        }

        return false;
    }

    // Calculate the current characters, their worlds / zones and return that back as a series of objects separated by world and zone
    public collate(): Map<string, PopulationData> {
        const populationData: Map<string, PopulationData> = new Map<string, PopulationData>();

        for (const characterData of this.characters.values()) {
            if (!characterData.zone) {
                CharacterPresenceHandler.logger.warn(
                    `Attempted to calculate populations without any zones! Char: ${characterData.character} World:${characterData.world}`,
                );
                continue;
            }

            const mapKey = `${characterData.world}-${characterData.zone}`;

            if (!populationData.has(mapKey)) {
                populationData.set(mapKey, new PopulationData(
                    characterData.world,
                    characterData.zone,
                    0,
                    0,
                    0,
                    0,
                    0,
                ));
            }

            const entry = populationData.get(mapKey);

            if (!entry) {
                CharacterPresenceHandler.logger.error('Unable to get population data of just freshly created / existing entry!');
                continue;
            }

            // Perform calculations & increases here
            populationData.set(mapKey, new PopulationData(
                entry.world,
                entry.zone,
                characterData.faction === Faction.VANU_SOVEREIGNTY ? entry.vs + 1 : entry.vs,
                characterData.faction === Faction.NEW_CONGLOMERATE ? entry.nc + 1 : entry.nc,
                characterData.faction === Faction.TERRAN_REPUBLIC ? entry.tr + 1 : entry.tr,
                characterData.faction === Faction.NS_OPERATIVES ? entry.nso + 1 : entry.nso,
                entry.total + 1,
            ));
        }

        CharacterPresenceHandler.logger.debug('==== Population Metrics ====');
        CharacterPresenceHandler.logger.debug(jsonLogOutput(populationData.values()));
        CharacterPresenceHandler.logger.debug('==== End Population Metrics ====');

        return populationData;
    }

    public async init(): Promise<void> {
        CharacterPresenceHandler.logger.debug('Initializing CharacterPresenceHandler...');

        if (this.initialized) {
            throw new ApplicationException('CharacterPresenceHandler was called to be initialized more than once!', 'CharacterPresenceHandler');
        }

        let rows: CharacterPresenceSchemaInterface[] = [];

        try {
            rows = await this.factory.model.find().exec();
        } catch (err) {
            throw new ApplicationException('Unable to retrieve CharacterPresenceHandler records!', 'CharacterPresenceHandler');
        }

        if (!rows.length) {
            CharacterPresenceHandler.logger.warn('No CharacterPresenceHandler records found! This could be entirely normal however.');
        } else {
            rows.forEach((row) => {
                const characterData = new CharacterData(
                    row.character,
                    row.world,
                    row.zone,
                    row.faction,
                    row.lastSeen,
                );
                this.characters.set(row.character, characterData);

                if (characterData.character === TestCharacters.MAELSTROME26) {
                    CharacterPresenceHandler.logger.debug(`Found test character ${characterData.character}!`);
                }
            });
        }

        // Start timer to scan the data and flush old records
        this.flushTimer = setInterval(() => {
            CharacterPresenceHandler.logger.debug('Running CharacterPresentHandler flushTimer');
            const threshold = 120000; // 2 mins
            const now = new Date().getTime();
            const deadline = now - threshold;

            for (const characterData of this.characters.values()) {

                if (characterData.lastSeen.getTime() < deadline) {
                    CharacterPresenceHandler.logger.debug(`Deleting CharacterPresence record for char: ${characterData.character} due to inactivity`);

                    if (characterData.character === TestCharacters.MAELSTROME26) {
                        CharacterPresenceHandler.logger.debug(`Deleting CharacterPresence record for TEST char: ${characterData.character} due to inactivity`);

                    }

                    void this.delete(characterData.character);
                }
            }
        }, 60000);

        CharacterPresenceHandler.logger.debug(`${rows.length} records loaded from CharacterPresence collection.`);
    }
}
