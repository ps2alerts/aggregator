import {inject, injectable} from 'inversify';
import {Zone} from '../constants/zone';
import CharacterPresenceData from '../data/CharacterPresenceData';
import {getLogger} from '../logger';
import CharacterPresenceHandlerInterface from '../interfaces/CharacterPresenceHandlerInterface';
import PopulationData from '../data/PopulationData';
import {Faction} from '../constants/faction';
import {jsonLogOutput} from '../utils/json';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import {CharacterPresenceSchemaInterface} from '../models/CharacterPresenceModel';
import {TYPES} from '../constants/types';
import ApplicationException from '../exceptions/ApplicationException';
import Character from '../data/Character';

@injectable()
export default class CharacterPresenceHandler implements CharacterPresenceHandlerInterface {
    private static readonly logger = getLogger('CharacterPresenceHandler');

    private readonly characters: Map<string, CharacterPresenceData> = new Map<string, CharacterPresenceData>();

    private readonly factory: MongooseModelFactory<CharacterPresenceSchemaInterface>;

    private readonly initialized = false;

    private flushTimer: NodeJS.Timeout|null = null;

    constructor(@inject(TYPES.characterPresenceFactory) factory: MongooseModelFactory<CharacterPresenceSchemaInterface>) {
        this.factory = factory;
    }

    public async update(character: Character, zone: number|null = null): Promise<boolean> {
        // Handle Sanctuary / unrecognised zones here
        if (zone && !Object.values(Zone).includes(zone)) {
            CharacterPresenceHandler.logger.debug(`Discarding CharacterPresence update, unrecognized zone: ${zone}`);
            return true;
        }

        const characterData = new CharacterPresenceData(
            character.id,
            character.world,
            zone,
            character.faction,
            new Date(),
        );

        this.characters.set(character.id, characterData);

        await this.factory.model.updateOne({
            character: characterData.character,
        }, {
            zone: characterData.zone,
            lastSeen: characterData.lastSeen,
            $setOnInsert: {
                world: characterData.world,
                faction: characterData.faction,
            },
        }, {
            upsert: true,
        });

        return true;
    }

    public async delete(characterId: string): Promise<boolean> {
        if (this.characters.has(characterId)) {
            this.characters.delete(characterId);

            try {
                await this.factory.model.deleteOne({
                    characterId,
                });
                CharacterPresenceHandler.logger.silly(`Deleted CharacterPresenceHandler record for Char ${characterId}`);
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`Error creating CharacterPresenceHandler record for Char: ${characterId} - E: ${err}`, 'CharacterPresenceHandler');
            }

            return true;
        }

        CharacterPresenceHandler.logger.debug(`Attempted to delete non-existent CharacterPresenceHandler record for Char: ${characterId} - potentially missing PlayerLogin event`, 'CharacterPresenceHandler');

        return false;
    }

    // Calculate the current characters, their worlds / zones and return that back as a series of objects separated by world and zone
    public collate(): Map<string, PopulationData> {
        const populationData: Map<string, PopulationData> = new Map<string, PopulationData>();

        for (const characterData of this.characters.values()) {
            if (!characterData.zone) {
                CharacterPresenceHandler.logger.debug(
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
                const characterData = new CharacterPresenceData(
                    row.character,
                    row.world,
                    row.zone,
                    row.faction,
                    row.lastSeen,
                );
                this.characters.set(row.character, characterData);
            });
        }

        // Start timer to scan the data and flush old records
        this.flushTimer = setInterval(() => {
            CharacterPresenceHandler.logger.debug('Running CharacterPresentHandler flushTimer');
            const threshold = 5 * 60 * 1000; // 5 mins
            const now = new Date().getTime();
            const deadline = now - threshold;

            for (const characterData of this.characters.values()) {

                if (characterData.lastSeen.getTime() < deadline) {
                    CharacterPresenceHandler.logger.silly(`Deleting CharacterPresence record for char: ${characterData.character} due to inactivity`);
                    void this.delete(characterData.character);
                }
            }
        }, 60000);

        CharacterPresenceHandler.logger.debug(`${rows.length} records loaded from CharacterPresence collection.`);
    }
}
