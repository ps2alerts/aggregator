import InstanceAbstract from './InstanceAbstract';
import {shortAlert} from '../ps2alerts-constants/metagameEventType';
import {World} from '../ps2alerts-constants/world';
import {Zone} from '../ps2alerts-constants/zone';
import PS2AlertsInstanceInterface from '../interfaces/PS2AlertsInstanceInterface';
import {Ps2alertsEventState} from '../ps2alerts-constants/ps2alertsEventState';
import {Phase} from '../ps2alerts-constants/outfitwars/phase';
import {Ps2alertsEventType} from '../ps2alerts-constants/ps2alertsEventType';
import {OutfitwarsTerritoryResultInterface} from '../interfaces/outfitwars/OutfitwarsTerritoryResultInterface';

export default class OutfitWarsTerritoryInstance extends InstanceAbstract implements PS2AlertsInstanceInterface {
    constructor(
        public readonly world: World,
        public readonly zone: Zone.NEXUS, // This is provided by exploding the ZoneEvent zoneDefinitionID
        public readonly zoneInstanceId: number, // This is provided by exploding the ZoneEvent zoneInstanceId
        public readonly timeStarted: Date,
        public timeEnded: Date | null,
        public result: OutfitwarsTerritoryResultInterface | null,
        state: Ps2alertsEventState,
        ps2alertsEventType: Ps2alertsEventType,
        public readonly matchId: number,
        public readonly phase: Phase,
    ) {
        super(
            `outfitwars-${world}-${zone}-${zoneInstanceId}`,
            world,
            zone,
            timeStarted,
            timeEnded,
            shortAlert,
            state,
            ps2alertsEventType,
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
