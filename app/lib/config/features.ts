export default class Features {
    public readonly events: {
        AchievementEarned: true,
        BattleRankUp: true,
        ContinentLock: true,
        ContinentUnlock: true,
        Death: true,
        FacilityControl: true,
        GainExperience: true,
        ItemAdded: true,
        MetagameEvent: true,
        PlayerFacilityCapture: true,
        PlayerFacilityDefend: true,
        PlayerLogin: true,
        PlayerLogout: true,
        SkillAdded: true,
        VehicleDestroy: true
    }
    public readonly allowedServers: [1,10,13,17,19,40]
}