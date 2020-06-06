module.exports = {
    ACCEPT_ADMIN_CONNECTION: true,
    DB_DEBUG: true,
    EVENTS: {
        AchievementEarned: false,
        BattleRankUp: false,
        ContinentLock: true,
        ContinentUnlock: true,
        Death: true,
        FacilityControl: true,
        GainExperience: false,
        ItemAdded: false,
        MetagameEvent: true,
        PlayerFacilityCapture: false,
        PlayerFacilityDefend: false,
        PlayerLogin: false,
        PlayerLogout: false,
        SkillAdded: false,
        VehicleDestroy: false
    },
    MONITORED_SERVERS: [1,10,13,17,19], // TODO: Add SolTech ID
}