// This broker is responsible for grabbing the requested character data using the built in PS2Census event methods, but handling exceptions.

import Character from '../data/Character';
import {AttackerEvent, MaxRetryException} from 'ps2census';
import ApplicationException from '../exceptions/ApplicationException';
import {Injectable, Logger} from '@nestjs/common';
import ExceptionHandler from '../handlers/system/ExceptionHandler';
import {CharacterEvent} from 'ps2census/dist/client/events/base/character.event';
import FakeCharacterFactory from '../factories/FakeCharacterFactory';
import StatisticsHandler, {MetricTypes} from '../handlers/StatisticsHandler';
import Redis from 'ioredis';

@Injectable()
export default class CharacterBroker {
    private static readonly logger = new Logger('CharacterBroker');

    constructor(
        private readonly fakeCharacterFactory: FakeCharacterFactory,
        private readonly statisticsHandler: StatisticsHandler,
        private readonly cacheClient: Redis,
    ) {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async get(payload: CharacterEvent<any>): Promise<{ character: Character, attacker: Character }> {
        let started = new Date();

        try {
            // Set a default in case attacker doesn't result
            let character: Character;
            let attacker = this.fakeCharacterFactory.build(parseInt(payload.world_id, 10));

            const characterActuallyExists = payload.character_id && payload.character_id !== '0';

            // Only attempt to get the character if one exists to grab
            if (characterActuallyExists) {
                // Check if the character is in the cache first before grabbing it (which in turn puts it in cache)
                const cached = await this.checkIfInCache(payload.character_id);

                character = new Character(await payload.character());

                if (!cached) {
                    await this.statisticsHandler.logMetric(started, MetricTypes.CENSUS_CHARACTER);
                }
            } else {
                character = this.fakeCharacterFactory.build(parseInt(payload.world_id, 10));
            }

            if (payload instanceof AttackerEvent) {
                // Re-create character with teamID supplied, if character exists
                if (characterActuallyExists) {
                    // Check if the character is in the cache first before grabbing it (which in turn puts it in cache)
                    const cached = await this.checkIfInCache(payload.character_id);

                    started = new Date();
                    character = new Character(await payload.character(), parseInt(payload.team_id, 10));

                    if (!cached) {
                        await this.statisticsHandler.logMetric(started, MetricTypes.CENSUS_CHARACTER);
                    }
                }

                if (!payload.attacker_character_id || payload.attacker_character_id === '0') {
                    attacker = this.fakeCharacterFactory.build(parseInt(payload.world_id, 10));
                    CharacterBroker.logger.error('AttackerEvent had no actual attacker character ID! ps2census bug');
                } else {
                    started = new Date();
                    const cached = await this.checkIfInCache(payload.attacker_character_id);

                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    const attackerCharacter = await payload.attacker();

                    if (!cached) {
                        await this.statisticsHandler.logMetric(started, MetricTypes.CENSUS_CHARACTER);
                    }

                    if (attackerCharacter) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                        attacker = new Character(attackerCharacter, parseInt(payload.attacker_team_id, 10));
                    } // Else serve fake
                }
            }

            return {character, attacker};
        } catch (err) {
            if (err instanceof MaxRetryException) {
                await this.statisticsHandler.logMetric(started, MetricTypes.CENSUS_CHARACTER, false, true);
                new ExceptionHandler('Census failed to return character data after maximum retries', err, 'CharacterBroker');
            }

            new ExceptionHandler('Census failed to return character data not due to retries!', err, 'CharacterBroker');
        }

        throw new ApplicationException('CharacterBroker failed to return characters, even fake ones!', 'CharacterBroker');
    }

    // ps2census will cache the character data for us, but we need to know if it's in the cache or not for metrics
    private async checkIfInCache(characterId: string): Promise<boolean> {
        const cacheKey = `character:${characterId}`;
        const started = new Date();
        const cached = !!await this.cacheClient.exists(cacheKey);

        if (cached) {
            await this.statisticsHandler.logMetric(started, MetricTypes.CACHE_CHARACTER_HITS, null, null);
        } else {
            await this.statisticsHandler.logMetric(started, MetricTypes.CACHE_CHARACTER_MISSES, null, null);
        }

        return cached;
    }
}
