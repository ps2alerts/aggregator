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

@injectable()
export default class CharacterPresenceHandler implements CharacterPresenceHandlerInterface {
    private static readonly logger = getLogger('CharacterPresenceHandler');

    private readonly characters: Map<string, CharacterData> = new Map<string, CharacterData>();

    private readonly factory: MongooseModelFactory<CharacterPresenceSchemaInterface>;

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

        this.characters.set(characterId, characterData);

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

        return true;
    }

    public async delete(characterId: string): Promise<boolean> {
        if (this.characters.has(characterId)) {
            this.characters.delete(characterId);

            try {
                await this.factory.model.deleteMany({
                    character: characterId,
                });
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`Error creating character presence entry! Char: ${characterId} - E: ${err}`, 'CharacterPresenceHandler');
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
        CharacterPresenceHandler.logger.debug(jsonLogOutput(populationData));

        return populationData;
    }

    public boot(): void {
        // Pull out current records from the database so we can restore
    }
}
