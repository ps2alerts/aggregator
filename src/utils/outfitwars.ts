import {Phase} from '../ps2alerts-constants/outfitwars/phase';

export function getOutfitWarRound(date: Date): number {
    return date < new Date(2022, 8, 29) ? 1 // Qualifiers
        : date < new Date(2022, 9, 5) ? 2
        : date < new Date(2022, 9, 12) ? 3
        : date < new Date(2022, 9, 19) ? 4 // Playoff Ro8
        : date < new Date(2022, 9, 26) ? 5 // Playoff Ro4
        : date < new Date(2022, 10, 3) ? 6 // Playoff Ro4
        : 7; // Championship
}

export function getOutfitWarPhase(round: number): Phase {
    return round < 5 ? Phase.QUALIFIERS
        : round < 7 ? Phase.PLAYOFFS
        : Phase.CHAMPIONSHIPS;
}
