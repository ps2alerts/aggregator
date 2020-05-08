var config = {
    serviceID: 'yourcensusserviceID',
    extendedAPIKey: 'yougetthisfromjhett12321',
    serverPort: 1337,
    database : {
        primary : {
            host: '123.456.789.0',
            user: 'dbUser',
            pass: 'dbPass',
            name: 'dbname'
        },
        cache : {
            host: '123.456.789.0',
            user: 'dbUser',
            pass: 'dbPass',
            name: 'dbname'
        }
    },
    toggles : {
        metagame: true, // Allows tracking of alerts
        jaeger: true, // Allows messages from the event server Jaeer.
        combat: true, // Enables tracking combat
        facilitycontrol: true, // Enables map tracking
        vehicledestroy: true, // Enables vehicle destruction tracking
        populationchange: true, // Enables population numbers tracking provided by Jhett
        xpmessage: true, // Enables XP tracking (requires more work)
        classStats: true, // Enables Class Statistitcs tracking
        achievements: false, // Enables Achievement tracking
        sync: true // Enables syncing of alerts with census
    },
    debug : {
        achievements: false,
        actives: true,
        API: true,
        auth: false,
        batch: false,
        cache: false,
        census: false,
        charFlags: false,
        charID: false,
        classes: false,
        clients: false,
        combat: false,
        datadump: false,
        databaseWarnings: true,
        databaseQuries: true,
        duplicates: false,
        facility: false,
        instances: true,
        jaeger: true,
        keepalive: false,
        metagame: false,
        perf: false,
        population: false,
        responses: false,
        resultID: true,
        status: true,
        sync: false,
        time: true,
        upcoming: true,
        vehicles: false,
        weapons: true,
        xpmessage: false,
    }
};

var supplementalConfig = {
    worlds : {
        1: 'Connery',
        10: 'Miller',
        13: 'Cobalt',
        17: 'Emerald',
        19: 'Jaeger',
        25: 'Briggs',
        // TODO: Find SolTech's worldID
        // TODO: Find out which PS2 servers are still operational
        1000: 'Genudine (PS4US)',
        1001: 'Palos (PS4US)',
        1002: 'Crux (PS4US)',
        1003: 'Searhus (PS4US)',
        1004: 'Xelas (PS4US)',
        2000: 'Ceres (PS4EU)',
        2001: 'Lithcorp (PS4EU)',
        2002: 'Rashnu (PS4EU)'
    }
};

exports.getConfig = function () {
    return config;
};

exports.getSupplementalConfig = function () {
    return supplementalConfig;
};
