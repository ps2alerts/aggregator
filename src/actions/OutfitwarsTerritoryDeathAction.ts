import {ActionInterface} from '../interfaces/ActionInterface';
import {ps2AlertsApiEndpoints} from '../ps2alerts-constants/ps2AlertsApiEndpoints';
import {AxiosInstance} from 'axios';
import DeathEvent from '../handlers/ps2census/events/DeathEvent';
import OutfitWarsTerritoryInstance from '../instances/OutfitWarsTerritoryInstance';
import {Team} from '../ps2alerts-constants/outfitwars/team';
import {Faction} from '../ps2alerts-constants/faction';
import {Logger} from '@nestjs/common';
import StatisticsHandler, {MetricTypes} from '../handlers/StatisticsHandler';

export default class OutfitwarsTerritoryDeathAction implements ActionInterface<boolean> {
    private static readonly logger = new Logger('OutfitwarsTerritoryDeathAction');

    constructor(
        private readonly event: DeathEvent,
        private readonly ps2AlertsApiClient: AxiosInstance,
        private readonly statisticsHandler: StatisticsHandler,
    ) {}

    public async execute(): Promise<boolean> {
        const instance = this.event.instance as OutfitWarsTerritoryInstance;

        // Bail if not both of the characters have an outfit
        if (!(this.event.attackerCharacter.outfit && this.event.character.outfit)) {
            OutfitwarsTerritoryDeathAction.logger.error(`[${this.event.instance.instanceId}] Somehow during outfit wars, a character did not have an outfit`);
            return true;
        }

        // Bail if teams are defined already
        if (instance.outfitwars.teams && !!instance.outfitwars.teams.blue && !!instance.outfitwars.teams.red) {
            return true;
        }

        // If any attacker / victim was NSO, stop here as we suspect the team IDs for NSO are scuffed somehow
        if (this.event.character.faction === Faction.NS_OPERATIVES || this.event.attackerCharacter.faction === Faction.NS_OPERATIVES) {
            return true;
        }

        // If neither team is defined, create the teams object
        if (!instance.outfitwars.teams) {
            instance.outfitwars.teams = {};
        }

        // Update team from attacker character team id (if the team is not already defined)
        if (this.event.attackerTeamId.valueOf() === Team.BLUE && !instance.outfitwars.teams.blue) {
            OutfitwarsTerritoryDeathAction.logger.log(`[${this.event.instance.instanceId}] Updating blue team outfit to '${this.event.attackerCharacter.outfit.name}' from DeathEvent using teamId :o`);
            instance.outfitwars.teams.blue = this.event.attackerCharacter.outfit;
        } else if (this.event.attackerTeamId.valueOf() === Team.RED && !instance.outfitwars.teams.red) {
            OutfitwarsTerritoryDeathAction.logger.log(`[${this.event.instance.instanceId}] Updating red team outfit to '${this.event.attackerCharacter.outfit.name}' from DeathEvent using teamId :o`);
            instance.outfitwars.teams.red = this.event.attackerCharacter.outfit;
        }

        // Update team from victim character team id (if the team is not already defined)
        if (this.event.teamId.valueOf() === Team.BLUE && !instance.outfitwars.teams.blue) {
            OutfitwarsTerritoryDeathAction.logger.log(`[${this.event.instance.instanceId}] Updating blue team outfit to '${this.event.character.outfit.name}' from DeathEvent using teamId :o`);
            instance.outfitwars.teams.blue = this.event.character.outfit;
        } else if (this.event.teamId.valueOf() === Team.RED && !instance.outfitwars.teams.red) {
            OutfitwarsTerritoryDeathAction.logger.log(`[${this.event.instance.instanceId}] Updating red team outfit to '${this.event.character.outfit.name}' from DeathEvent using teamId :o`);
            instance.outfitwars.teams.red = this.event.character.outfit;
        }

        const toUpdate = [];
        toUpdate.push(this.ps2AlertsApiClient.patch(
            ps2AlertsApiEndpoints.outfitwarsInstance.replace('{instanceId}', this.event.instance.instanceId), {
                outfitwars: instance.outfitwars,
            },
        ).catch((err: Error) => {
            OutfitwarsTerritoryDeathAction.logger.error(`[${this.event.instance.instanceId}] Unable to update the instance record via API! Err: ${err.message}`);
        }));

        if (instance.outfitwars.teams?.blue){
            toUpdate.push(
                this.ps2AlertsApiClient.patch(
                    ps2AlertsApiEndpoints.outfitwarsUpdateRanking
                        .replace('{outfitId}', instance.outfitwars.teams.blue.id)
                        .replace('{round}', instance.outfitwars.round.toString()), {
                        instanceId: instance.instanceId,
                    },
                ).catch((err: Error) => {
                    if (instance.outfitwars.teams?.blue){
                        OutfitwarsTerritoryDeathAction.logger.error(`Could not update ${instance.outfitwars.teams.blue.name.trim()}'s round ${instance.outfitwars.round} ranking!`);
                    }

                    OutfitwarsTerritoryDeathAction.logger.error(`${err.message}`);
                }),
            );
        }

        if (instance.outfitwars.teams?.red){
            toUpdate.push(
                this.ps2AlertsApiClient.patch(
                    ps2AlertsApiEndpoints.outfitwarsUpdateRanking
                        .replace('{outfitId}', instance.outfitwars.teams.red.id)
                        .replace('{round}', instance.outfitwars.round.toString()), {
                        instanceId: instance.instanceId,
                    },
                ).catch((err: Error) => {
                    if (instance.outfitwars.teams?.red){
                        OutfitwarsTerritoryDeathAction.logger.error(`Could not update ${instance.outfitwars.teams.red.name.trim()}'s round ${instance.outfitwars.round} ranking!`);
                    }

                    OutfitwarsTerritoryDeathAction.logger.error(`${err.message}`);
                }),
            );
        }

        const started = new Date();

        return await Promise.all(toUpdate).then(async () => {
            (this.event.instance as OutfitWarsTerritoryInstance).outfitwars = instance.outfitwars;
            await this.statisticsHandler.logTime(started, MetricTypes.PS2ALERTS_API);
            return true;
        }).catch(() => {
            return false;
        });
    }
}
