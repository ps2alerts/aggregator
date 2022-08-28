import {getLogger} from '../logger';
import {ActionInterface} from '../interfaces/ActionInterface';
import {ps2AlertsApiEndpoints} from '../ps2alerts-constants/ps2AlertsApiEndpoints';
import {AxiosInstance} from 'axios';
import DeathEvent from '../handlers/ps2census/events/DeathEvent';
import OutfitWarsTerritoryInstance from '../instances/OutfitWarsTerritoryInstance';
import {Team} from '../ps2alerts-constants/outfitwars/team';

export default class OutfitwarsTerritoryDeathAction implements ActionInterface<boolean> {
    private static readonly logger = getLogger('OutfitwarsTerritoryDeathAction');

    constructor(
        private readonly event: DeathEvent,
        private readonly ps2AlertsApiClient: AxiosInstance,
    ) {}

    public async execute(): Promise<boolean> {
        const instance = this.event.instance as OutfitWarsTerritoryInstance;

        // Bail if not both of the characters have an outfit
        if (!(this.event.attackerCharacter.outfit && this.event.character.outfit)) {
            OutfitwarsTerritoryDeathAction.logger.error(`[${this.event.instance.instanceId}] Somehow during outfit wars, a character did not have an outfit`);
            return true;
        }

        // Bail if teams are defined already
        if (instance.outfitwars.teams && !!instance.outfitwars.teams.blue && !!instance.outfitwars.teams.blue) {
            return true;
        }

        // If neither team is defined, create the teams object
        if (!instance.outfitwars.teams) {
            instance.outfitwars.teams = {};
        }

        // Update team from attacker character team id (if the team is not already defined)
        if (this.event.attackerTeamId.valueOf() === Team.BLUE && !instance.outfitwars.teams.blue) {
            OutfitwarsTerritoryDeathAction.logger.info(`[${this.event.instance.instanceId}] Updating blue team outfit to '${this.event.attackerCharacter.outfit.name}' from DeathEvent using teamId :o`);
            instance.outfitwars.teams.blue = this.event.attackerCharacter.outfit;
        } else if (this.event.attackerTeamId.valueOf() === Team.RED && !instance.outfitwars.teams.red) {
            OutfitwarsTerritoryDeathAction.logger.info(`[${this.event.instance.instanceId}] Updating red team outfit to '${this.event.attackerCharacter.outfit.name}' from DeathEvent using teamId :o`);
            instance.outfitwars.teams.red = this.event.attackerCharacter.outfit;
        }

        // Update team from victim character team id (if the team is not already defined)
        if (this.event.teamId.valueOf() === Team.BLUE && !instance.outfitwars.teams.blue) {
            OutfitwarsTerritoryDeathAction.logger.info(`[${this.event.instance.instanceId}] Updating blue team outfit to '${this.event.character.outfit.name}' from DeathEvent using teamId :o`);
            instance.outfitwars.teams.blue = this.event.character.outfit;
        } else if (this.event.teamId.valueOf() === Team.RED && !instance.outfitwars.teams.red) {
            OutfitwarsTerritoryDeathAction.logger.info(`[${this.event.instance.instanceId}] Updating red team outfit to '${this.event.character.outfit.name}' from DeathEvent using teamId :o`);
            instance.outfitwars.teams.red = this.event.character.outfit;
        }

        await this.ps2AlertsApiClient.patch(
            ps2AlertsApiEndpoints.outfitwarsInstance.replace('{instanceId}', this.event.instance.instanceId), {
                outfitwars: instance.outfitwars,
            },
        ).catch((err: Error) => {
            OutfitwarsTerritoryDeathAction.logger.error(`[${this.event.instance.instanceId}] Unable to update the instance record via API! Err: ${err.message}`);
        });

        (<OutfitWarsTerritoryInstance> this.event.instance).outfitwars = instance.outfitwars;

        return true;
    }
}
