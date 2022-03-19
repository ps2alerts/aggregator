import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import {Kill} from 'ps2census';
import {MQAcceptedPatterns} from '../../../constants/MQAcceptedPatterns';
import ApiMQDelayPublisher from '../../../services/rabbitmq/publishers/ApiMQDelayPublisher';
import ApiMQGlobalAggregateMessage from '../../../data/ApiMQGlobalAggregateMessage';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import {Bracket} from '../../../constants/bracket';
import FactionUtils from '../../../utils/FactionUtils';

@injectable()
export default class GlobalWeaponAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('GlobalWeaponAggregate');
    private readonly apiMQPublisher: ApiMQPublisher;
    private readonly apiMQDelayPublisher: ApiMQDelayPublisher;

    constructor(
    @inject(TYPES.apiMQPublisher) apiMQPublisher: ApiMQPublisher,
        @inject(TYPES.apiMQDelayPublisher) apiMQDelayPublisher: ApiMQDelayPublisher,
    ) {
        this.apiMQPublisher = apiMQPublisher;
        this.apiMQDelayPublisher = apiMQDelayPublisher;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        GlobalWeaponAggregate.logger.silly('GlobalWeaponAggregate.handle');

        const attackerFactionShort = FactionUtils.parseFactionIdToShortName(event.attackerCharacter.faction);
        const victimFactionShort = FactionUtils.parseFactionIdToShortName(event.character.faction);

        const documents = [];

        documents.push({$setOnInsert: {
            weapon: event.attackerWeapon,
        }});

        if (event.killType === Kill.Normal || event.killType === Kill.Undetermined) {
            documents.push({$inc: {kills: 1}});
        }

        if (event.killType === Kill.TeamKill) {
            documents.push({$inc: {teamKills: 1}});
        }

        if (event.killType === Kill.Suicide || event.killType === Kill.RestrictedArea) {
            documents.push({$inc: {suicides: 1}});
        }

        if (event.isHeadshot && event.killType !== Kill.TeamKill) {
            documents.push({$inc: {headshots: 1}});
        }

        // Faction vs Faction
        if (event.attackerCharacter.faction !== event.character.faction) {
            const factionKey = `factionKills.${attackerFactionShort}.${victimFactionShort}`;
            documents.push({$inc: {[factionKey]: 1}});
        }

        try {
            await this.apiMQDelayPublisher.send(new ApiMQGlobalAggregateMessage(
                MQAcceptedPatterns.GLOBAL_WEAPON_AGGREGATE,
                event.instance.instanceId,
                documents,
                [{
                    world: event.instance.world,
                    'weapon.id': event.attackerWeapon.id,
                }],
            ), event.instance.duration);

            await this.apiMQPublisher.send(new ApiMQGlobalAggregateMessage(
                MQAcceptedPatterns.GLOBAL_WEAPON_AGGREGATE,
                event.instance.instanceId,
                documents,
                [{
                    world: event.instance.world,
                    'weapon.id': event.attackerWeapon.id,
                }],
                Bracket.TOTAL,
            ));
        } catch (err) {
            if (err instanceof Error) {
                GlobalWeaponAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
            }
        }

        return true;
    }
}
