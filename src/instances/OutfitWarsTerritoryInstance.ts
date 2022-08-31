/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import InstanceAbstract from './InstanceAbstract';
import {shortAlert} from '../ps2alerts-constants/metagameEventType';
import {World} from '../ps2alerts-constants/world';
import {Zone} from '../ps2alerts-constants/zone';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import {Ps2AlertsEventState} from '../ps2alerts-constants/ps2AlertsEventState';
import {Ps2AlertsEventType} from '../ps2alerts-constants/ps2AlertsEventType';
import {OutfitwarsTerritoryResultInterface} from '../ps2alerts-constants/interfaces/OutfitwarsTerritoryResultInterface';
import OutfitWarsMetadataInterface from '../interfaces/OutfitWarsMetadataInterface';

export default class OutfitWarsTerritoryInstance extends InstanceAbstract implements PS2AlertsInstanceInterface {
    constructor(
        public readonly world: World,
        public readonly zone: Zone.NEXUS, // This is provided by exploding the ZoneEvent zoneDefinitionID
        public readonly zoneInstanceId: number, // This is provided by exploding the ZoneEvent zoneInstanceId
        public readonly timeStarted: Date,
        public timeEnded: Date | null,
        public result: OutfitwarsTerritoryResultInterface | null,
        state: Ps2AlertsEventState,
        public outfitwars: OutfitWarsMetadataInterface,
    ) {
        super(
            `outfitwars-${world}-${zone}-${zoneInstanceId}`,
            world,
            zone,
            timeStarted,
            timeEnded,
            shortAlert,
            state,
            Ps2AlertsEventType.OUTFIT_WARS_AUG_2022,
        );
    }

    public match(world: World | null, zone: Zone | null): boolean {
        // TODO: Make this work off zoneInstanceID
        return world && zone
            ? world === this.world && zone === this.zone
            : world ? world === this.world
            : zone === this.zone;
    }
}
