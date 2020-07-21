import {
    AchievementEarnedData,
    BattleRankUpData,
    DeathData,
    FacilityControlData,
    GainExperienceData,
    PlayerFacilityCaptureData,
    PlayerFacilityDefendData,
    VehicleDestroyData,
    PS2Event,
} from 'ps2census';
import ActiveAlertInterface from '../interfaces/ActiveAlertInterface';

export default class PS2AlertsEvent {
    public readonly event: PS2Event;
    public readonly alert: ActiveAlertInterface;

    constructor(
        event: PS2Event,
        alert: ActiveAlertInterface,
    ) {
        this.event = event;
        this.alert = alert;
    }
}

export declare type PS2ZoneEvents = AchievementEarnedData | BattleRankUpData | DeathData | FacilityControlData | GainExperienceData | PlayerFacilityCaptureData | PlayerFacilityDefendData | VehicleDestroyData;
