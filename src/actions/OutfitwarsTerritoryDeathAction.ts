import {getLogger} from '../logger';
import {ActionInterface} from '../interfaces/ActionInterface';
import {ps2AlertsApiEndpoints} from '../ps2alerts-constants/ps2AlertsApiEndpoints';
import {AxiosInstance} from 'axios';
import DeathEvent from '../handlers/ps2census/events/DeathEvent';
import OutfitWarsTerritoryInstance from '../instances/OutfitWarsTerritoryInstance';

export default class OutfitwarsTerritoryDeathAction implements ActionInterface<boolean> {
    private static readonly logger = getLogger('OutfitwarsTerritoryDeathAction');

    constructor(
        private readonly event: DeathEvent,
        private readonly ps2AlertsApiClient: AxiosInstance,
    ) {}

    public async execute(): Promise<boolean> {
        const instance = this.event.instance as OutfitWarsTerritoryInstance;

        // Bail if no teams exist yet
        if (!instance.outfitwars.teams){
            return true;
        }

        // Bail if both teams are defined already
        if (!!instance.outfitwars.teams.blue === !!instance.outfitwars.teams.red) {
            return true;
        }

        // Bail if not both of the characters have an outfit
        if (!(this.event.attackerCharacter.outfit && this.event.character.outfit)) {
            return true;
        }

        // Bail if both of the outfits have the same id
        if (this.event.attackerCharacter.outfit.id === this.event.character.outfit.id) {
            return true;
        }

        if (instance.outfitwars.teams.blue) {
            instance.outfitwars.teams.red = (instance.outfitwars.teams.blue.id === this.event.attackerCharacter.outfit.id)
                ? this.event.character.outfit
                : this.event.attackerCharacter.outfit;
            OutfitwarsTerritoryDeathAction.logger.debug(`Updated red team outfit to '${instance.outfitwars.teams.red.name}' from DeathEvent`);
        } else if (instance.outfitwars.teams.red) {
            instance.outfitwars.teams.blue = (instance.outfitwars.teams.red.id === this.event.attackerCharacter.outfit.id)
                ? this.event.character.outfit
                : this.event.attackerCharacter.outfit;
            OutfitwarsTerritoryDeathAction.logger.debug(`Updated blue team outfit to '${instance.outfitwars.teams.blue.name}' from DeathEvent`);
        } else {
            OutfitwarsTerritoryDeathAction.logger.warn('Neither team defined when updating teams from DeathEvent?');
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
