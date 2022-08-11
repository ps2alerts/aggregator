import InstanceAbstract from './InstanceAbstract';
import {shortAlert} from '../ps2alerts-constants/metagameEventType';
import {World} from '../ps2alerts-constants/world';
import {Zone} from '../ps2alerts-constants/zone';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import {Ps2alertsEventState} from '../ps2alerts-constants/ps2alertsEventState';
import {Phase} from '../ps2alerts-constants/outfitwars/phase';
import {Ps2alertsEventType} from '../ps2alerts-constants/ps2alertsEventType';
import {OutfitwarsTerritoryResultInterface} from '../ps2alerts-constants/interfaces/OutfitwarsTerritoryResultInterface';

export default class OutfitWarsTerritoryInstance extends InstanceAbstract implements PS2AlertsInstanceInterface {
    constructor(
        public readonly world: World,
        public readonly zone: Zone.NEXUS, // This is provided by exploding the ZoneEvent zoneDefinitionID
        public readonly zoneInstanceId: number, // This is provided by exploding the ZoneEvent zoneInstanceId
        public readonly timeStarted: Date,
        public timeEnded: Date | null,
        public result: OutfitwarsTerritoryResultInterface | null,
        state: Ps2alertsEventState,
        public readonly phase: Phase, // Denotes the phase of the event
        public readonly round: number, // Denotes what round of matches it is, e.g. round 2. This is incremental, e.g. phase 2 won't reset to round 1.
    ) {
        super(
            `outfitwars-${world}-${zone}-${zoneInstanceId}`,
            world,
            zone,
            timeStarted,
            timeEnded,
            shortAlert,
            state,
            Ps2alertsEventType.OUTFIT_WARS_AUG_2022,
        );
    }

    public match(world: World | null = null, zone: Zone): boolean {
        // TODO: Make this work off zoneInstanceID
        return world && zone
            ? world === this.world && zone === this.zone
            : world ? world === this.world
            : zone === this.zone;
    }
}
