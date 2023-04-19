import {ActionInterface} from '../interfaces/ActionInterface';
import FacilityControlEvent from '../handlers/ps2census/events/FacilityControlEvent';
import {ps2AlertsApiEndpoints} from '../ps2alerts-constants/ps2AlertsApiEndpoints';
import OutfitWarsTerritoryInstance from '../instances/OutfitWarsTerritoryInstance';
import {Team} from '../ps2alerts-constants/outfitwars/team';
import {Rest} from 'ps2census';
import Outfit from '../data/Outfit';
import {Logger} from '@nestjs/common';
import MetricsHandler, {MetricTypes} from '../handlers/MetricsHandler';
import {PS2AlertsApiDriver} from '../drivers/PS2AlertsApiDriver';

export default class OutfitwarsTerritoryTeamAction implements ActionInterface<boolean> {
    private static readonly logger = new Logger('OutfitwarsTerritoryTeamAction');

    constructor(
        private readonly instance: OutfitWarsTerritoryInstance,
        private readonly event: FacilityControlEvent,
        private readonly restClient: Rest.Client,
        private readonly ps2AlertsApiClient: PS2AlertsApiDriver,
        private readonly metricsHandler: MetricsHandler,
    ) {}

    public async execute(): Promise<boolean> {
        // Defences won't tell us anything new, bail
        if (this.event.isDefence) {
            return true;
        }

        // All teams are defined, no need to update them
        if (this.instance.outfitwars.teams?.blue && this.instance.outfitwars.teams.red) {
            return true;
        }

        // An outfit didn't capture this territory, bail (should not happen after initial)
        if (!this.event.outfitCaptured) {
            return true;
        }

        /* eslint-disable @typescript-eslint/naming-convention */
        const censusOutfit = (await this.restClient.getQueryBuilder('outfit').get({outfit_id: this.event.outfitCaptured}))[0];

        if (!censusOutfit) {
            OutfitwarsTerritoryTeamAction.logger.warn(`No outfit found for capture credit outfit id ${this.event.outfitCaptured}, skipping.`);
            return true;
        }

        const leader = (await this.restClient.getQueryBuilder('character').get({character_id: censusOutfit.leader_character_id}))[0];
        /* eslint-enable @typescript-eslint/naming-convention */

        const captureOutfit: Outfit = {
            id: censusOutfit.outfit_id,
            name: censusOutfit.name,
            faction: parseInt(leader.faction_id, 10),
            world: this.instance.world,
            leader: censusOutfit.leader_character_id,
            tag: censusOutfit.alias,
        };

        let teams = this.instance.outfitwars.teams;
        const captureTeamIsBlue = (this.event.newFaction as unknown as Team) === Team.BLUE;
        const captureTeamIsRed = (this.event.newFaction as unknown as Team) === Team.RED;

        OutfitwarsTerritoryTeamAction.logger.debug(`Updated ${captureTeamIsBlue ? 'blue' : (captureTeamIsRed ? 'red' : 'UNKNOWN')} team outfit to '${captureOutfit.name}' from FacilityControlEvent`);

        if (teams === undefined) {
            teams = {
                blue: captureTeamIsBlue
                    ? captureOutfit
                    : undefined,
                red: captureTeamIsRed
                    ? captureOutfit
                    : undefined,
            };
        } else if (!teams.blue && captureTeamIsBlue) {
            teams.blue = captureOutfit;
        } else if (!teams.red && captureTeamIsRed) {
            teams.red = captureOutfit;
        }

        this.instance.outfitwars.teams = teams;

        const started = new Date();

        this.ps2AlertsApiClient.patch(
            ps2AlertsApiEndpoints.outfitwarsInstance.replace('{instanceId}', this.instance.instanceId),
            {
                outfitwars: this.instance.outfitwars,
            },
        ).catch((err: Error) => {
            OutfitwarsTerritoryTeamAction.logger.error(`[${this.instance.instanceId}] Unable to update the instance record for TeamAction via API! Err: ${err.message}`);
        });

        await this.metricsHandler.logMetric(started, MetricTypes.PS2ALERTS_API);

        return true;
    }
}
