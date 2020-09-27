import {Inject, Injectable} from '@nestjs/common';
import {API_SERVICE} from '../constants/client.constants';
import {ClientProxy} from '@nestjs/microservices';
import {Death} from 'ps2census';
import {On} from 'ps2census-nestjs';
import {BaseRecorder} from '../recorders/interfaces/base.recorder';

@Injectable()
export class DeathProcessor {
    constructor(
        @Inject(API_SERVICE) private readonly client: ClientProxy,
    ) {
    }

    @On({event: 'death'})
    async handle(death: Death): Promise<void> {
        const recorders: BaseRecorder[] = []; // Inject some service that holds all the recorders and retrieve them here

        const attackerName = 'Beep';
        const victimName = 'Boop';

        recorders.forEach((recorder) => {

            // Register death
            this.client.emit({
                action: 'patch',
                entity: 'character',
            }, {
                query: {
                    character_id: death.character_id,
                    recording: recorder.id,
                },
                update: {
                    deathCount: {$inc: 1},
                    deaths: {
                        $push: {
                            name: attackerName,
                            attacker_id: death.attacker_character_id,
                            attacker_weapon_id: death.attacker_weapon_id,
                            timestamp: death.timestamp,
                        },
                    },
                    $setOnInsert: {
                        name: victimName,
                    },
                },
            });

            // Register kill
            this.client.emit({
                action: 'patch',
                entity: 'character',
            }, {
                query: {
                    character_id: death.attacker_character_id,
                    recording: recorder.id,
                },
                update: {
                    killCount: {$inc: 1},
                    kills: {
                        $push: {
                            name: victimName,
                            victim_id: death.attacker_character_id,
                            attacker_weapon_id: death.attacker_weapon_id,
                            timestamp: death.timestamp,
                        },
                    },
                    $setOnInsert: {
                        name: attackerName,
                    },
                },
            });

        })
    }
}
