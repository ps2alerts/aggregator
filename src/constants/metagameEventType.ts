import {Zone} from './zone';
import {MetagameDetailsInterface} from './MetagameDetails';
import {Faction} from './faction';

export enum MetagameEventType {
    // Current Generation normal alerts
    INDAR_SUPERIORITY = 147,
    INDAR_ENLIGHTENMENT = 148,
    INDAR_LIBERATION = 149,
    ESAMIR_SUPERIORITY = 150,
    ESAMIR_ENLIGHTENMENT = 151,
    ESAMIR_LIBERATION = 152,
    HOSSIN_SUPERIORITY = 153,
    HOSSIN_ENLIGHTENMENT = 154,
    HOSSIN_LIBERATION = 155,
    AMERISH_SUPERIORITY = 156,
    AMERISH_ENLIGHTENMENT = 157,
    AMERISH_LIBERATION = 158,

    // Current Generation Unstable Meltdowns
    ESAMIR_UNSTABLE_MELTDOWN = 176,
    HOSSIN_UNSTABLE_MELTDOWN = 177,
    AMERISH_UNSTABLE_MELTDOWN = 178,
    INDAR_UNSTABLE_MELTDOWN = 179,

    ESAMIR_UNSTABLE_MELTDOWN_2 = 186,
    HOSSIN_UNSTABLE_MELTDOWN_2 = 187,
    AMERISH_UNSTABLE_MELTDOWN_2 = 188,
    INDAR_UNSTABLE_MELTDOWN_2 = 189,

    ESAMIR_UNSTABLE_MELTDOWN_3 = 190,
    HOSSIN_UNSTABLE_MELTDOWN_3 = 191,
    AMERISH_UNSTABLE_MELTDOWN_3 = 192,
    INDAR_UNSTABLE_MELTDOWN_3 = 193,
}

export const metagameEventTypeArray = [
    147,
    148,
    149,
    150,
    151,
    152,
    153,
    154,
    155,
    156,
    157,
    158,
    176,
    177,
    178,
    179,
    186,
    189,
    191,
    193,
    208,
    209,
    210,
];

const longAlert = 3600000;
const shortAlert = 1800000;

// TODO: Generate this from the API
export const metagameEventTypeDetailsMap: Map<number, MetagameDetailsInterface> = new Map<number, MetagameDetailsInterface>(
    [
        [147, {title: 'Indar Superiority', zone: Zone.INDAR, duration: longAlert, triggeringFaction: Faction.TERRAN_REPUBLIC, unstable: false}],
        [148, {title: 'Indar Enlightenment', zone: Zone.INDAR, duration: longAlert, triggeringFaction: Faction.VANU_SOVEREIGNTY, unstable: false}],
        [149, {title: 'Indar Liberation', zone: Zone.INDAR, duration: longAlert, triggeringFaction: Faction.NEW_CONGLOMERATE, unstable: false}],

        [150, {title: 'Esamir Superiority', zone: Zone.ESAMIR, duration: longAlert, triggeringFaction: Faction.TERRAN_REPUBLIC, unstable: false}],
        [151, {title: 'Esamir Enlightenment', zone: Zone.ESAMIR, duration: longAlert, triggeringFaction: Faction.VANU_SOVEREIGNTY, unstable: false}],
        [152, {title: 'Esamir Liberation', zone: Zone.ESAMIR, duration: longAlert, triggeringFaction: Faction.NEW_CONGLOMERATE, unstable: false}],

        [153, {title: 'Hossin Superiority', zone: Zone.HOSSIN, duration: longAlert, triggeringFaction: Faction.TERRAN_REPUBLIC, unstable: false}],
        [154, {title: 'Hossin Superiority', zone: Zone.HOSSIN, duration: longAlert, triggeringFaction: Faction.VANU_SOVEREIGNTY, unstable: false}],
        [155, {title: 'Hossin Superiority', zone: Zone.HOSSIN, duration: longAlert, triggeringFaction: Faction.NEW_CONGLOMERATE, unstable: false}],

        [156, {title: 'Amerish Superiority', zone: Zone.AMERISH, duration: longAlert, triggeringFaction: Faction.TERRAN_REPUBLIC, unstable: false}],
        [157, {title: 'Amerish Superiority', zone: Zone.AMERISH, duration: longAlert, triggeringFaction: Faction.VANU_SOVEREIGNTY, unstable: false}],
        [158, {title: 'Amerish Superiority', zone: Zone.AMERISH, duration: longAlert, triggeringFaction: Faction.NEW_CONGLOMERATE, unstable: false}],

        // Unstable Meltdowns
        [176, {title: 'Esamir Unstable Meltdown', zone: Zone.ESAMIR, duration: shortAlert, triggeringFaction: Faction.NEW_CONGLOMERATE, unstable: true}],
        [177, {title: 'Hossin Unstable Meltdown', zone: Zone.HOSSIN, duration: shortAlert, triggeringFaction: Faction.NEW_CONGLOMERATE, unstable: true}],
        [178, {title: 'Amerish Unstable Meltdown', zone: Zone.AMERISH, duration: shortAlert, triggeringFaction: Faction.NEW_CONGLOMERATE, unstable: true}],
        [179, {title: 'Indar Unstable Meltdown', zone: Zone.INDAR, duration: shortAlert, triggeringFaction: Faction.NEW_CONGLOMERATE, unstable: true}],

        [186, {title: 'Esamir Unstable Meltdown', zone: Zone.ESAMIR, duration: shortAlert, triggeringFaction: Faction.VANU_SOVEREIGNTY, unstable: true}],
        [187, {title: 'Hossin Unstable Meltdown', zone: Zone.HOSSIN, duration: shortAlert, triggeringFaction: Faction.VANU_SOVEREIGNTY, unstable: true}],
        [188, {title: 'Amerish Unstable Meltdown', zone: Zone.AMERISH, duration: shortAlert, triggeringFaction: Faction.VANU_SOVEREIGNTY, unstable: true}],
        [189, {title: 'Indar Unstable Meltdown', zone: Zone.INDAR, duration: shortAlert, triggeringFaction: Faction.VANU_SOVEREIGNTY, unstable: true}],

        [190, {title: 'Esamir Unstable Meltdown', zone: Zone.ESAMIR, duration: shortAlert, triggeringFaction: Faction.TERRAN_REPUBLIC, unstable: true}],
        [191, {title: 'Hossin Unstable Meltdown', zone: Zone.HOSSIN, duration: shortAlert, triggeringFaction: Faction.TERRAN_REPUBLIC, unstable: true}],
        [192, {title: 'Amerish Unstable Meltdown', zone: Zone.AMERISH, duration: shortAlert, triggeringFaction: Faction.TERRAN_REPUBLIC, unstable: true}],
        [193, {title: 'Indar Unstable Meltdown', zone: Zone.INDAR, duration: shortAlert, triggeringFaction: Faction.TERRAN_REPUBLIC, unstable: true}],
    ],
);
