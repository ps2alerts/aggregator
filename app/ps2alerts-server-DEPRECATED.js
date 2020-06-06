/**
 * Author: Maelstrome26
 *
 * Description: This Node script acts as both a client and a server for interacting with incoming data from the DBG streaming API as well as passing data to connected clients at PS2Alerts.com.
 *
 * Note: This script is in DIRE need of a rewrite, it has grown beyond being managable. I'm currently not innovating on it at the moment as I don't have much time on my hands nowadays.
 */

//Includes
var WebSocket = require('ws');
var http = require('http');
var https = require('https');
var fs = require('fs');
var mysql = require('mysql');
var url = require('url');
var clone = require('clone');
var clc = require('cli-color');
var critical = clc.red.bold;
var warning = clc.yellow;
var notice = clc.blueBright;
var success = clc.green.bold;
var usage = require('usage');
var pid = process.pid; // you can use any valid PID instead

var configStore = require('./config.js');
var config = configStore.getConfig(); // Call the getConfig function to load the config
var supplementalConfig = configStore.getSupplementalConfig();

// Main Database Pool
var pool = mysql.createPool({
    connectionLimit: 700,
    host: config.database.primary.host,
    user: config.database.primary.user,
    password: config.database.primary.pass,
    database: config.database.primary.name,
    waitForConnections: true, // Flag to throw errors when connections are being starved.
    supportBigNumbers: true,
    bigNumberStrings: true
});

// Cache pool
var cachePool = mysql.createPool({
    connectionLimit: 20,
    host: config.database.cache.host,
    user: config.database.cache.user,
    password: config.database.cache.pass,
    database: config.database.cache.name,
    waitForConnections: true,
    supportBigNumbers: true,
    bigNumberStrings: true
});

// Better handling of uncaught Exceptions, allowing you to email yourself or log it or whatnot.
process.on('uncaughtException', function(err) {
    console.error(new Date().toUTCString() + ' uncaughtException:', err.message);
    console.error(err.stack);

    reportError(err, "uncaughtException");
});

/**
 * Global Variable Setup
 *
 */
var instances = {};
var populationInstances = {};
var subscriptions = 0; // Check to see if we have valid subscriptions
var subscriptionsRetry = 0;
var connectionState = 0;
var activesNeeded = false; // A flag set when the activeAlert function requires to be called

/**
 * Intervals
 */
var conWatcherInterval;
var subWatcherInterval;
var subscriptionDisplayTimeout = null;
var subscriptionDisplayContent = {};

var wsClient;
var perfStats = {};

/**************
Admin API Keys
***************/

var apiKeys = {};

function dbQuery(options, callback) {
    var selectedPool = null;

    if (!options.d) {
        options.d = null;
    }

    if (options.p === 'cache') {
        selectedPool = cachePool;
    } else {
        selectedPool = pool;
    }

    if (config.debug.databaseQueries === true) {
        console.log('dbQuery q', options.q);
        console.log('dbQuery d', options.d);
    }

    selectedPool.query(options.q, options.d, function(err, returns) {
        if (err) {
            if (err.errno === 1213) { // If deadlock or duplicate
                handleDeadlock(options, selectedPool, 0);
            } else if (err.errno === 1062) {
                handleDuplicate(options, selectedPool);
            } else {
                throw (err);
            }
        }
        if (callback) {
            return callback(returns);
        }
    });
}

function handleDeadlock(options, selectedPool, tries) {
    if (config.debug.databaseErrors === true) {
        console.log(warning("Handling deadlock... try #"+tries));
    }

    if (tries < 20) {
        var rand = Math.random() * (1000 - 250) + 250;

        setTimeout(function() {
            selectedPool.query(options.q, options.d, function(err, result) {
                if (err) {
                    if (err.errno === 1213) { // If deadlock
                        handleDeadlock(options, selectedPool, tries); // Call upon itself to try again. #Recursion
                    }
                }

                if (result) {
                    if (result.affectedRows > 0 && config.debug.databaseErrors === true) {
                        console.log(success("Deadlock handled!"));
                    }
                } else {
                    reportError(options.q, "ERROR HANDLING DEADLOCK RESULT");
                    console.log('query', options.q);
                    console.log('data', options.d);
                }
            });
        }, rand);
    } else {
        var error = new Error().stack;
        reportError(error, "ERROR HANDLING DEADLOCK!");
        console.log('query', options.q);
        console.log('data', options.d);
    }
}

function handleDuplicate(options, selectedPool) {
    if (config.debug.databaseErrors) {
        console.log('Handling duplicate...');
    }

    if (options.f === undefined) {
        reportError('Unable to handle duplicate! No fallback supplied!', 'handleDuplicate');
        console.log('Original Query', options.q);
        return false;
    }

    if (options.f === null) {
        if (config.debug.databaseErrors === true) {
            console.log('Fallback query explicitly defined as null, ignoring fallback');
            console.log('Original query pre fallback:', options.q);
            return false;
        }
    }

    if (!options.d) {
        console.log('nulled options.d');
        options.d = null;
    }

    if (config.debug.databaseQueries) {
        console.log('Failback Query', options.f);
        console.log('Failback data', options.d);
    }

    selectedPool.query(options.f, options.d, function(err) {
        if (err) {
            if (err.errno === 1213) { // If deadlock or duplicate
                handleDeadlock(options, selectedPool);
            } else if (err.errno === 1062) {
                console.log(critical('Query attempted:', options.f));
                reportError('handleDuplicate is fucked.', 'handleDuplicate');
            }
        } else {
            if (config.debug.databaseErrors) {
                console.log(success('handleDuplicate was successful'));
                console.log('Original query:', options.q);
                console.log('Fallback query:', options.f);
            }
        }
    });
}

//Pulls API keys from the database so that clients may communicate with this websocket server safely
function generate_api_keys() {
    dbQuery({q:'SELECT * FROM APIUsers', p:'cache'}, function(result) {
        for (var i = result.length - 1; i >= 0; i--) {
            apiKeys[i] = {};

            apiKeys[i].apikey = String(result[i].apikey);
            apiKeys[i].user = result[i].user;
            apiKeys[i].site = result[i].site;
            apiKeys[i].admin = result[i].admin;
        }
    });
}

// Functionality to authenticate requests and allow certain actions to happen
function checkAPIKey(APIKey, callback) {
    var isValid = false;
    var admin = false;
    var username = false;

    APIKey = String(APIKey);

    if (APIKey !== "undefined") {
        if (config.debug.auth === true) {
            console.log (notice("CHECKING API KEY: "+APIKey));
        }

        Object.keys(apiKeys).forEach(function(i) {// Loop through the API keys array to check against supplied key
            if (apiKeys[i].apikey === APIKey) {// If there's a match
                isValid = true;

                if (config.debug.auth === true) {
                    console.log(success("API KEY MATCH"));
                }

                username = apiKeys[i].user;

                if (parseInt(apiKeys[i].admin) !== 0) {// If an admin
                    admin = true;
                }
            }
        });
    }

    callback(isValid, username, admin);
}

/*********************************************
    FIRE ZE LAZORS (start the process going)
*********************************************/

generate_weapons(function() // Generate weapons first, before loading websocket
{
    console.log("WEAPONS READY!");
    conWatcherInterval = setInterval(function() {//You can change this if you want to reconnect faster, or slower.
        conWatcher();
    }, 3000);

    subWatcherInterval = setInterval(function() {
        subWatcher();
    }, 10000); //You can change this if you want to reconnect faster, or slower.

    generate_api_keys();

    // BOOM
    wsClient = new persistentClient();
});

/**************
    Client    *
**************/

var client;

function persistentClient()
{
    console.log("HOUSTON, WE ARE GO FOR LAUNCH!");
    var connected = true;

    //Return Status of connection.
    this.isConnected = function() {
        return connected;
    };

    console.log("Connecting Client...");

    client = new WebSocket('ws://push.api.blackfeatherproductions.com/?apikey='+config.extendedAPIKey); // Jhett's API

    // Websocket Event callbacks
    client.on('open', function() {
        console.log(success("CONNECTED"));

        connectionState = 1;

        restoreSubs(function() { // Fire subscriptions if they are needed
            console.log(success("Subscriptions restored!"));
        });

        setMaintenanceInterval();
    });

    client.on('message', function(data) {
        if(config.debug.datadump === true) {
            console.log(data);
        }

        processMessage(data, client);
    });

    client.on('error', function(error) {
        console.log((new Date()) + error.toString());
        connected = false;
    });

    client.on('close', function(code) {
        console.log(critical(new Date()) + ' CLIENT Websocket Connection Closed [' + code +']');
        connected = false;
        clearInterval(maintInterval);
    });
}

/************************
    Client Functions    *
************************/

var eventsMonitor;
var lastWorldDisruption = {};
var worldStatus = { // Assuming online always at first run
    1: "online",
    10: "online",
    13: "online",
    17: "online",
    19: "online",
    25: "online",
    1000: 'online',
    1001: 'online',
    1002: 'online',
    1003: 'online',
    1004: 'online',
    2000: 'online',
    2001: 'online'
};

function onConnect(client) // Set up the websocket
{
    if (config.debug.clients === true) {
        console.log(new Date() + ' WebSocket client connected!');
    }

    //"outfits":["37514584004240963"] 37514584004240963 DIGT | 37524142189447090 = PS2AlertsTesting

    if (config.toggles.metagame === true) { // If alerts are enabled
        console.log(success("SENDING METAGAME SUBSCRIPTION MESSAGE"));
        var alertsMessage  = '{"action":"subscribe","event":"MetagameEvent","all":"true"}'; // Subscribe to all alerts that happen

        try {
            client.send(alertsMessage);
        } catch (e) {
            reportError("Error: "+e, "Metagame Subscription Message Failed", true);
        }

        if (config.toggles.populationchange === true) {
            var populationChangeMessage = '{"action":"subscribe","event":"PopulationChange","population_types":["zone"]}';

            console.log(success(populationChangeMessage));

            try {
                client.send(populationChangeMessage);
            } catch (e) {
                console.log(critical("ERROR SENDING  MESSAGE"));
                reportError("Error from API Socket - "+e, "Population Message", true);
                return false;
            }
        }
    }

    if (config.debug.instances === true) {
        console.log("INSTANCES ARRAY BUILT");

        console.log("============= INSTANCES DETECTED ===============");
        console.log(instances);
        console.log("================================================");
    }

    /* Fire instances dependant code */
    clearInterval(eventsMonitor);
}

function checkMapInitial(callback)
{
    Object.keys(instances).forEach(function(key) {
        dbQuery({q:"SELECT * FROM ws_map_initial WHERE resultID = "+instances[key].resultID}, function(result) {
            if (result[0] === undefined) { // If no map initial records exist, run it

                console.log(critical("MAP INITIAL MISSING FOR ALERT: #"+instances[key].resultID));
                insertInitialMapData(instances[key], function()
                {
                    console.log(success("Inserted Initial Map data succesfully"));
                });
            }
        });
    });

    callback();
}

var eventTypes = ['MetagameEvent', 'Combat', 'FacilityControl', 'VehicleDestroy', 'PopulationChange', 'ExperienceEarned', 'AchievementEarned'];

//Processes Messages received from the client.
function processMessage(messageData, client)
{
    var message;

    try  {// Check if the message we get is valid json.
        message = JSON.parse(messageData);
    }
    catch(exception) {
        console.log(messageData);
        message = null;

        reportError("FAILURE TO PARSE JSON", messageData);
    }

    if (message) { // If valid
        if (config.toggles.sync === true) {
            if (message.action && message.action === "activeMetagameEvents") {
                if (config.debug.sync === true) {
                    console.log(notice("Sending Actives to processor"));
                }
                processActives(message);
            }
        }

        var eventType  = message.event_type;
        var eventCheck = eventTypes.indexOf(eventType);

        checkDuplicateMessages(message, function(messageValid) {
            if (messageValid === true) {
                if (eventCheck !== -1) { // If a valid event type
                    message = message.payload;

                    if (eventType === "MetagameEvent" && config.toggles.metagame === true) { // Alert Processing
                        if (config.debug.metagame === true) {
                            console.log(JSON.stringify(message, null, 4));
                        }

                        var alertType = parseInt(message.metagame_event_type_id);
                        var world = parseInt(message.world_id);
                        var alertStatus = parseInt(message.status);

                        APIAlertTypes(alertType, function(typeData) { // Check if alerts are supported
                            if (typeData !== null) { // If a valid alert type
                                var zone = parseInt(typeData.zone);
                                message.zone_id = typeData.zone;

                                if (!zone) {
                                    console.log(critical(JSON.stringify(message, null, 4)));
                                    throw("MISSING ZONE ID FOR WORLD: "+world);
                                }

                                console.log(notice("Processing Alert Message"));

                                findResultID(message, eventType, function(resultIDArray) { // Get resultID for all functions
                                    if (alertStatus === 1) { // If started
                                        if (world !== 19) {
                                            if (resultIDArray.length === 0) {
                                                console.log(success("================== STARTING ALERT! =================="));
                                                insertAlert(message, function(resultID) {
                                                    console.log(success("================ INSERTED NEW ALERT #"+resultID+" ("+supplementalConfig.worlds[world]+") ================"));
                                                });
                                            } else {
                                                console.log(critical("RESULT ALREADY FOUND, IGNORING"));
                                                reportError("Result already found. "+JSON.stringify(message, null, 4), "Insert Alert");
                                            }
                                        } else {
                                            console.log(critical("Received Jaeger Alert Start message. Ignored."));
                                        }
                                    } else if (alertStatus === 0) { // If alert end
                                        console.log(notice(resultIDArray));
                                        var resultID = resultIDArray[0];

                                        if (resultID !== undefined) {
                                            console.log(success("================== ENDING ALERT =================="));
                                            endAlert(message, resultID, function(resultID) {
                                                console.log(success("================ SUCCESSFULLY ENDED ALERT #"+resultID+" ("+supplementalConfig.worlds[world]+") ================"));
                                            });
                                        } else {
                                            reportError("UNDEFINED RESULT ID ALERT END - World: "+world, "End Alert");
                                        }
                                    }
                                    else if (alertStatus === 2) {
                                        if (config.debug.metagame === true) {
                                            console.log("Alert update received.");
                                        }
                                    }
                                });
                            } else {
                                console.log(critical("INVALID / UNSUPPORTED ALERT TYPE: "+alertType+" - WORLD: #"+world));
                                reportError("UNSUPPORTED ALERT TYPE DETECTED: "+alertType, "Insert Alert");
                            }
                        });
                    } else {
                        findResultID(message, eventType, function(resultIDArray) { // Get resultID for all functions
                            if (config.debug.resultID === true && config.debug.jaeger === false) {
                                if (resultIDArray.length === 0) {
                                    console.log(critical("RESULT ID COULD NOT BE FOUND!"));
                                    console.log(resultIDArray);
                                } else {
                                    console.log(notice("ResultIDs Found:"));
                                    console.log(resultIDArray);
                                }
                            }

                            for (var i = resultIDArray.length - 1; i >= 0; i--) {
                                var resultID = resultIDArray[i];
                                if (config.toggles.combat === true) {
                                    if (eventType === "Combat") {// If a combat event
                                        combatParse(message, resultID, function() {
                                            if (config.debug.combat === true) {
                                                console.log('Combat message successfully parsed');
                                            }
                                        });
                                    }
                                }
                                if (config.toggles.facilitycontrol === true) {
                                    if (eventType === "FacilityControl") { // If a territory Update
                                        if (resultID) {
                                            updateMapData(message, resultID, function() {
                                                if (config.debug.facility === true) {
                                                    console.log(success("PROCESSED FACILITY CONTROL"));
                                                }
                                            });
                                        }
                                    }
                                }
                                if (config.toggles.vehicledestroy === true) {
                                    if (eventType === "VehicleDestroy") {
                                        insertVehicleStats(message, resultID, 0);
                                    }
                                }

                                if (config.toggles.populationchange === true) {
                                    if (eventType === "PopulationChange") {
                                        var VSPop    = message.population_vs;
                                        var NCPop    = message.population_nc;
                                        var TRPop    = message.population_tr;
                                        var TotalPop = message.population_total;
                                        var world    = parseInt(message.world_id);
                                        var zone     = parseInt(message.zone_id);

                                        if (config.debug.population === true) {
                                            console.log(notice("POPULATION CHANGE DETECTED"));
                                            console.log(message);
                                        }

                                        if (populationInstances[resultID] === undefined) {
                                            populationInstances[resultID] = {
                                                VS: 0,
                                                NC: 0,
                                                TR: 0,
                                                total: 0,
                                                world: world,
                                                zone: zone
                                            };
                                        }

                                        populationInstances[resultID] = {
                                            VS: VSPop,
                                            NC: NCPop,
                                            TR: TRPop,
                                            total: TotalPop,
                                            world: world,
                                            zone: zone
                                        };

                                        if (config.debug.population === true) {
                                            console.log(populationInstances[resultID]);
                                        }

                                        insertPopulationStats(resultID, function() {
                                            if (config.debug.population === true) {
                                                console.log("Processed Population Data");
                                            }
                                        });
                                    }
                                }

                                if (config.toggles.xpmessage === true) {
                                    if (eventType === "ExperienceEarned") {
                                        insertExperience(message, resultID);
                                    }
                                }

                                if (config.toggles.achievements === true) {
                                    if (eventType === "AchievementEarned") {
                                        insertAchievement(message, resultID);
                                    }
                                }
                            } // End of result forEach
                        });
                    }
                } else { // If a system message
                    var known = 0;
                    if (message.websocket_event) {
                        onConnect(client);
                        console.log(message);
                    }

                    if (message.subscriptions !== undefined) {
                        known = 1;
                        subscriptions = 1;

                        if (message.subscriptions.Combat !== undefined) {
                            subscriptionDisplay(message.subscriptions.Combat.worlds, 'Combat', 'worlds', true);
                            subscriptionDisplay(message.subscriptions.Combat.zones, 'Combat', 'zones', true);
                        }

                        if (message.subscriptions.FacilityControl !== undefined) {
                            subscriptionDisplay(message.subscriptions.FacilityControl.worlds, 'FacilityControl', 'worlds', true);
                            subscriptionDisplay(message.subscriptions.FacilityControl.zones, 'FacilityControl', 'zones', true);
                        }

                        if (message.subscriptions.VehicleDestroy !== undefined) {
                            subscriptionDisplay(message.subscriptions.VehicleDestroy.worlds, 'VehicleDestroy', 'worlds', true);
                            subscriptionDisplay(message.subscriptions.VehicleDestroy.zones, 'VehicleDestroy', 'zones', true);
                        }

                        if (message.subscriptions.PopulationChange !== undefined) {
                            subscriptionDisplay(message.subscriptions.PopulationChange.worlds, 'PopulationChange', 'worlds', true);
                            subscriptionDisplay(message.subscriptions.PopulationChange.zones, 'PopulationChange', 'zones', true);
                        }

                        if (message.subscriptions.MetagameEvent !== undefined) {
                            subscriptionDisplay(message.subscriptions.MetagameEvent, 'MetagameEvent', 'Metagames', true);
                        }
                    }

                    if (message.action === "activeAlerts") {
                        known = 1;
                        console.log(notice("ACTIVE ALERTS RECEIVED:"));

                        if (config.debug.API === true) {
                            console.log(message);
                        }
                    }

                    if (message.event_type === "ServiceStateChange") {
                        known = 1;
                        var payloadOnline = parseInt(message.payload.online);

                        if (payloadOnline !== undefined) {
                            var time = new Date().getTime();
                            time = parseInt(time / 1000); // To convert to seconds

                            var worldID = message.payload.world_id;

                            if (lastWorldDisruption[worldID] === undefined) {
                                lastWorldDisruption[worldID] = null;
                            }

                            if (payloadOnline === 0) {
                                worldStatus[worldID] = "offline";
                                lastWorldDisruption[worldID] = time;

                                reportError("WORLD #"+worldID+" HAS CRASHED!", "World disruption");
                            } else if (payloadOnline === 1) {
                                var limit = 0;
                                worldStatus[worldID] = "online";
                                activesNeeded = true;

                                if (lastWorldDisruption[worldID]) {
                                    limit = lastWorldDisruption[worldID] + 30;
                                }

                                if (limit !== 0 && time > limit) {
                                    console.log(success("WORLD #"+worldID+" HAS RECOVERED!"));
                                    reportError("World: "+worldID+" has recovered", "World recovery");

                                    if (lastWorldDisruption[worldID] === null) {
                                        lastWorldDisruption[worldID] = time - 30;
                                    }

                                    var insertDisruption = {
                                        started: lastWorldDisruption[worldID],
                                        ended: time,
                                        world: worldID
                                    };

                                    dbQuery({q:"INSERT INTO ws_disruption SET ?", d: insertDisruption});
                                } else if (lastWorldDisruption[worldID]) {
                                    console.log(notice("World disruption was out of limit"));
                                }

                                lastWorldDisruption[worldID] = null;
                            }
                        }
                    }

                    if (known === 0) { // If unknown message
                        console.log(notice("Ignoring message: \n" + message));
                    }
                }
            }
            else if (eventType !== "PopulationChange") {
                var date = new Date();
                console.log(critical("Type: "+eventType));

                if (config.debug.duplicates === true) {
                    console.log(notice(JSON.stringify(message, null, 4)));
                }
                console.log(critical("DUPLICATE MESSAGE DETECTED ON W: "+message.payload.world_id+" - Z: "+message.payload.zone_id+", IGNORING! "+date));
            }
        });
    }
}

function findResultID(message, eventType, callback)
{
    var returnedResults = [];

    var world = parseInt(message.world_id);
    var zone = parseInt(message.zone_id);

    if (eventType === "MetagameEvent" && world === 19 && config.toggles.jaeger === false) {
        console.log(critical("Blocked Jaeger MetaGame Event message"));
        return callback(returnedResults);
    }

    var time = new Date().getTime();
    time = parseInt(time / 1000); // To convert to seconds

    Object.keys(instances).forEach(function(resultID) {
        if (instances[resultID].world === world && instances[resultID].zone === zone) {
            var startTime = instances[resultID].startTime;
            var endTime = instances[resultID].endTime;

            if (isNaN(startTime) === true) {
                console.log(instances[resultID]);
                throw('startTime is NaN for instance');
            }

            if (isNaN(endTime) === true) {
                console.log(instances[resultID]);
                throw('endTime is NaN for instance');
            }

            if (eventType !== "MetagameEvent" && eventType !== "PopulationChange") {
                if (startTime < time && endTime > time) { // If message is still within time
                    returnedResults.push(instances[resultID].resultID);
                } else if (config.debug.resultID === true) {
                    console.log(warning("MESSAGE RECEIVED OUT OF GAME TIME FOR RESULT #" + instances[resultID].resultID));
                }
            } else {
                returnedResults.push(instances[resultID].resultID);
            }
        }
    });

    if (returnedResults.length === 0) {
        if (config.debug.resultID) {
            console.log(eventType);
            console.log('world', world);
            console.log('zone', zone);
            console.log(message);
            console.log('No alert could be found for: W:' + world + ' Z:' + zone);
        }
    }

    return callback(returnedResults);
}

function reportError(error, loc, severeError)
{
    console.log(critical("++++++++++++++++++++++ ERROR DETECTED!!! ++++++++++++++++++++++"));
    console.log(notice(new Date().toString()));
    console.log(error);
    console.log(critical("LOCATION: "+loc));
    console.log(critical("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"));

    var time = new Date().getTime() / 1000;

    var errPost = {
        errorReturned: error,
        errorLocation: loc,
        time: parseInt(time)
    };

    dbQuery({q:'INSERT INTO ws_errors SET ?', d:errPost}, function() {
        if (severeError === true) {
            resetScript();
        }
    });
}

function resetScript() {
    console.log(critical("SEVERE ERROR DETECTED! RESTARTING SCRIPT!!!!!!!!"));
    reportError("RESTARTING SCRIPT", "resetScript");
    process.exit(0);
}

/**
 * message = {
 *      world_id,
 *      zone_id,
 *      metagame_event_type_id,
 *      start_time,
 *      control_vs,
 *      control_nc,
 *      control_tr,
 *      instance_id
 * }
 */

function insertAlert(message, callback)
{
    console.log(notice("NEW ALERT DETECTED!"));
    console.log(notice("ALERT MESSAGE FOLLOWS:"));
    console.log(message);

    var world = parseInt(message.world_id);
    var zone = parseInt(message.zone_id);
    var alertType = parseInt(message.metagame_event_type_id);

    // Check for the zone it's not present for some reason
    if (!zone || zone === 0) {
        APIAlertTypes(alertType, function(data) {
            console.log(notice('Force calculated zone from metagame type for world: ' + world));
            console.log(notice('New zone: ' + data.zone));
            zone = data.zone;
        });
    }

    if (!zone) {
        reportError('Zone could not be determined for the new alert!', 'InsertAlert');
        return false;
    }

    dbQuery({q:"SELECT * FROM ws_results WHERE ResultStartTime = "+message.start_time+" AND ResultServer="+world+" AND ResultAlertCont="+zone}, function(result) {
        if (result[0] !== undefined) {
            console.log(critical("Attempted to insert alert when already exists! World: "+world+" - Zone: "+zone));
            return;
        }

        if (message.start_time) { // If a valid alert message
            var now = new Date().getTime();
            var moment = require('moment-timezone');
            var timezone = 'UTC';

            var PST = 'America/Los_Angeles';
            var CDT = 'America/Swift_Current';
            var EST = 'America/New_York';
            var CEST = 'Europe/Paris';
            var AEST = 'Australia/Brisbane';

            // Calculate hour offset
            if (world === 1) { // Connery
                timezone = PST;
            } else if (world === 10) { // Miller
                timezone = CEST; // Central European Standard time
            } else if (world === 13) { // Cobad
                timezone = CEST; // Central European Standard time
            } else if (world === 17) { // Emerald
                timezone = EST; // Eastern Standard time
            } else if (world === 25) { // Briggs
                timezone = AEST; // Aussie Eastern Time
            } else if (world >= 2000 ) {
                timezone = CEST; // Central European Standard time
            } else if (world >= 1000 ) {
                timezone = CDT; // Central Standard Time
            }

            var timeHour = moment.tz(now, timezone).format('HH');
            var timeBracket = 'TEST';

            console.log(timeHour);

            if (timeHour >= 17 && timeHour <= 23) { // Prime
                timeBracket = 'PRI';
            } else if (timeHour >= 12 && timeHour <= 16) { // Afternoon
                timeBracket = 'AFT';
            } else {
                timeBracket = 'MOR';
            }

            var startAlert = {
                instanceID: message.instance_id,
                ResultStartTime: message.start_time,
                ResultServer: world,
                ResultTimeType: timeBracket,
                ResultAlertCont: zone,
                ResultAlertType: alertType,
                InProgress: 1
            };

            console.log("================ INSERTING INITIAL RECORD ================");

            dbQuery({q:'INSERT INTO ws_results SET ?', d:startAlert}, function(result) {
                var resultID = result.insertId;
                var ends = calcEndTime(message.start_time, message.metagame_event_type_id);

                console.log('INSERT INSTANCE END TIME:', ends);

                var monitorPost = {
                    instanceID: message.instance_id,
                    world: world,
                    zone: zone,
                    resultID: resultID,
                    started: message.start_time,
                    endtime: ends,
                    type: alertType
                };

                insertInitialMapData(monitorPost, function() {
                    console.log(success("Fired initial map script"));
                });

                var toSend = {
                    startTime: message.start_time,
                    endTime: ends,
                    world: world,
                    zone: zone,
                    resultID: resultID,
                    controlVS: message.control_vs,
                    controlNC: message.control_nc,
                    controlTR: message.control_tr,
                    metagameEventID: alertType
                };

                toSend.remaining = (parseInt(toSend.endTime) - parseInt(toSend.startTime));

                console.log(critical("Sending Websocket Message: "));
                console.log(critical(JSON.stringify(toSend, null, 4)));

                sendMonitor("alertStart", toSend);

                dbQuery({q:'INSERT INTO ws_instances SET ?', d:monitorPost}, function() {
                    console.log(success("INSERT ws_instances RECORD FOR ALERT: #"+resultID+" SUCCESSFUL!"));

                    var factionArray = {
                        resultID: resultID,
                        killsVS: 0,
                        killsNC: 0,
                        killsTR: 0,
                        deathsVS: 0,
                        deathsNC: 0,
                        deathsTR: 0,
                        teamKillsVS: 0,
                        teamKillsNC: 0,
                        teamKillsTR: 0,
                        suicidesVS: 0,
                        suicidesNC: 0,
                        suicidesTR: 0,
                        headshotsVS: 0,
                        headshotsNC: 0,
                        headshotsTR: 0,
                        totalKills: 0,
                        totalDeaths: 0,
                        totalTKs: 0,
                        totalSuicides: 0,
                        totalHeadshots: 0
                    };

                    dbQuery({q:'INSERT INTO ws_factions SET ?', d:factionArray}, function() {
                        console.log(success("INSERT ws_factions RECORD FOR ALERT: #"+resultID+" SUCCESSFUL!"));

                        console.log(notice("SENDING SUBSCRIPTIONS FOR ALERT: #"+resultID))
                        fireSubscriptions(message, resultID, "subscribe");

                        console.log(success("INSERT OF ALERT: #"+resultID+" SUCCESSFUL!"));
                        console.log(success("====================================================="));
                        callback(resultID);
                    });
                });
            });
        } else {
            console.log(critical("INVALID START TIME RECEIVED, SKIPPING!"));
        }
    });
}

function endAlert(message, resultID, callback) {
    console.log(message);
    var world = message.world_id;
    var zone = message.zone_id;

    console.log('================ ENDING ALERT #'+resultID+' - World: '+world+' - Zone: '+zone+' ================');

    if (resultID) {
        var date = new Date();
        var datetime = DateCalc(date);

        if (!message.end_time || message.end_time == "0") { // If time is empty, use the current datetime as a backup
            var newDate = new Date().getTime();
            message.end_time = parseInt(newDate / 1000);
        }

        /* Alert Processing */

        dbQuery({q:"SELECT * FROM ws_map WHERE resultID="+resultID+" ORDER BY timestamp DESC LIMIT 1"}, function(Lresult) {
            dbQuery({q:"SELECT * FROM ws_map WHERE resultID="+resultID+" ORDER BY timestamp ASC LIMIT 1"}, function(Fresult) {
                if (Fresult.length === 0 || Lresult.length === 0) {
                    reportError("MISSING CAPTURE LOGS. UNABLE TO CALCULATE END OF ALERT #" + resultID, "End Alert");
                    console.log(critical("Marking Alert " + resultID + " as invalid"));

                    dbQuery({q:'UPDATE ws_results SET Valid = 0, InProgress = 0, ResultEndTime = '+message.end_time+' WHERE ResultID = ' + resultID}, function () {
                        dbQuery({q:'DELETE FROM ws_instances WHERE resultID = ' + resultID}, function () {
                            delete populationInstances[resultID];
                            delete instances[resultID];
                            return false;
                        });
                    });
                }

                // If results have been pulled
                calcWinners(message, resultID, Lresult, function(winner, draw, domination) {
                    if (!winner) {
                        console.log(critical("UNABLE TO CALCULATE WINNER!"));
                        console.log("RESULT ID: "+resultID);
                        reportError("UNABLE TO CALCULATE WINNER: "+resultID, message, true);
                        return false;
                    }

                    console.log(success("WINNER IS: "+winner));
                    console.log("UPDATING RESULT RECORD #"+resultID);

                    dbQuery({q:'UPDATE ws_results SET ResultDateTime="'+datetime+'", InProgress="0", Valid="1", ResultEndTime="'+message.end_time+'", ResultWinner="'+winner+'", ResultDomination="'+domination+'", ResultDraw="'+draw+'" WHERE ResultID='+resultID}, function(result) {
                        if (result.affectedRows === 0) { // if it failed
                            reportError("UPDATING ALERT RECORD FAILED! #"+resultID, 'endAlert - Update Result', true)
                        }

                        console.log(success("RECORD UPDATED"));
                        console.log("DELETING INSTANCE RECORD #"+resultID);

                        dbQuery({q:'DELETE FROM ws_instances WHERE resultID='+resultID}, function(result) {
                            if (result.affectedRows === 0) { // if it failed
                                reportError("DELETING ALERT INSTANCE RECORD RECORD FAILED! #"+resultID, 'endAlert - Delete Instance', true);
                            }
                            console.log(success("INSTANCE DATABASE RECORD SUCCESSFULLY DELETED"));

                            if (instances[resultID] !== undefined) {
                                var toSend = {
                                    resultID: resultID,
                                    endTime: message.end_time,
                                    winner: winner,
                                    controlVS: instances[resultID].controlVS,
                                    controlNC: instances[resultID].controlNC,
                                    controlTR: instances[resultID].controlTR,
                                    domination: domination,
                                    world: world,
                                    zone: zone
                                };
                                console.log(notice("Sending end of alert websocket message: "));
                                console.log(notice(JSON.stringify(toSend, null, 4)));

                                sendMonitor("alertEnd", toSend);
                                sendResult("alertEnd", toSend, resultID);

                                //fireSubscriptions(message, resultID, "unsubscribe");
                                triggerLeaderboardUpdate(world);
                            } else {
                                reportError("INSTANCE COULD NOT BE DETECTED FOR ENDING ALERT: "+resultID, "End Alert");
                            }

                            delete populationInstances[resultID];
                            delete instances[resultID];

                            return callback(resultID);
                        });
                    });
                });
            });
        });
    } else {
        reportError("RESULT ID WAS NOT PASSED TO END ALERT SCRIPT", "End Alert");
    }
}

function updateMapData(message, resultID, callback)
{
    if (message.facility_id && message.is_block_update === "0") { // If Valid
        if (config.debug.facility === true) {
            console.log(notice(JSON.stringify(message, null, 4)));
        }

        var defence = 0;
        var isCapture = parseInt(message.is_capture);

        if (isCapture === 0) {
            defence = 1;
            console.log("DEFENCE!");
        }

        console.log('================ UPDATING ALERT MAP #'+resultID+' ================');

        //console.log(notice("INSERT 0"));
        var post = {
            resultID: resultID,
            timestamp: message.timestamp,
            facilityID: message.facility_id,
            facilityOwner: parseInt(message.new_faction_id),
            facilityOldOwner: parseInt(message.old_faction_id),
            controlVS: parseInt(message.control_vs),
            controlNC: parseInt(message.control_nc),
            controlTR: parseInt(message.control_tr),
            durationHeld: parseInt(message.duration_held),
            defence: defence,
            zone: parseInt(message.zone_id),
            world: parseInt(message.world_id),
            outfitCaptured: message.outfit_id
        };

        sendResult("facility", post, resultID);
        sendMonitor("update", post);

        dbQuery({q:'INSERT INTO ws_map SET ?', d:post}, function() {
            if (instances[resultID] === undefined) {
                reportError("MISSING INSTANCE FOR MAP UPDATE!!!", "Update Map");
                callback();
            }

            instances[resultID].controlVS = message.control_vs;
            instances[resultID].controlNC = message.control_nc;
            instances[resultID].controlTR = message.control_tr;

            if (defence === 0) {
                var instancesPost = {
                    controlVS: message.control_vs,
                    controlNC: message.control_nc,
                    controlTR: message.control_tr
                };

                dbQuery({q:"UPDATE ws_instances SET ? WHERE resultID = "+resultID, d:instancesPost}, function(result) {
                    if (result.affectedRows === 0) {
                        reportError('Instance didn\'t get updated. Result #' + resultID);
                    }
                });

                if (message.outfit_id > 0) {
                    dbQuery({q:"UPDATE ws_outfits_total SET outfitCaptures=outfitCaptures+1 WHERE outfitID = '"+message.outfit_id+"'"}, function(result) {
                        if (result.affectedRows === 0) {
                            reportError('ws_outfits_total outfit captures didn\'t get updated. Result #' + resultID);
                        }
                    });
                }
            }

            console.log(success("FACILITY / TERRITORY RECORD INSERTED FOR WORLD: "+supplementalConfig.worlds[message.world_id]+" - ZONE: "+message.zone_id));
            console.log(notice("New Control Percentages: ")+"VS: "+message.control_vs+"% - NC: "+message.control_nc+"% - TR: "+message.control_tr+"%");

            callback();
        });
    }
}

function combatParse(message, resultID, callback)
{
    var killerID        = message.attacker_character_id;
    var victimID        = message.victim_character_id;
    var killerOutfit    = message.attacker_outfit_id;
    var victimOutfit    = message.victim_outfit_id;
    var killerName      = message.attacker_character_name;
    var victimName      = message.victim_character_name;
    var attackerFaction = parseInt(message.attacker_faction_id);
    var victimFaction   = parseInt(message.victim_faction_id);
    var worldID         = parseInt(message.world_id);
    var suicide = 0;
    var teamKill = 0;

    messagesReceived++;
    messagesReceived30Sec++;

    if (attackerFaction === victimFaction) { // If a TK
        teamKill = 1;
    }

    if (killerID === victimID) {
        suicide = 1;
        teamKill = 0;
    }

    if (config.debug.combat === true) {
        console.log('================ INSERTING COMBAT RECORD ================');
    }

    // ATTEMPT TO GET CHARACTER NAME IF MISSING

    checkPlayerCache(killerID, message.world_id, function(killerName, killerBR) {
        if (config.debug.combat === true) {
            console.log("GOT NAME: "+killerName);
        }

        if (killerName === false) {
            killerName = message.attacker_character_name;
        }

        checkPlayerCache(victimID, message.world_id, function(victimName, victimBR) {
            if (config.debug.combat === true) {
                console.log("GOT NAME: "+victimName);
            }

            if (victimName === false) {
                victimName = message.victim_character_name;
            }

            if (!killerName || !victimName) {
                console.log(notice("Missing player names for combat event. Cancelling operations."));
            }

            if (killerOutfit === "0") {
                if (attackerFaction === 1) {
                    killerOutfit = "-1";
                }

                if (attackerFaction === 2) {
                    killerOutfit = "-2";
                }

                if (attackerFaction === 3) {
                    killerOutfit = "-3";
                }
            }

            if (victimOutfit === "0") {
                if (victimFaction === 1) {
                    victimOutfit = "-1";
                }

                if (victimFaction === 2) {
                    victimOutfit = "-2";
                }

                if (victimFaction === 3) {
                    victimOutfit = "-3";
                }
            }

            var combatArray = {
                timestamp: message.timestamp,
                resultID: parseInt(resultID),
                attackerID: killerID,
                attackerName: killerName,
                attackerOutfit: killerOutfit,
                attackerFaction: parseInt(message.attacker_faction_id),
                attackerLoadout: parseInt(message.attacker_loadout_id),
                attackerBR: parseInt(killerBR),
                victimID: victimID,
                victimName: victimName,
                victimOutfit: victimOutfit,
                victimFaction: parseInt(message.victim_faction_id),
                victimLoadout: parseInt(message.victim_loadout_id),
                victimBR: parseInt(victimBR),
                weaponID: parseInt(message.weapon_id),
                vehicleID: parseInt(message.vehicle_id),
                headshot: parseInt(message.is_headshot),
                zone: parseInt(message.zone_id),
                worldID: parseInt(message.world_id),
                teamkill: teamKill,
                suicide: suicide
            };

            if (config.debug.combat === true) {
                console.log(critical("===== ORIGINAL MESSAGE: ======="));
                console.log(critical(JSON.stringify(message, null, 4)));
                console.log("Combat Object Built");
                console.log(warning(JSON.stringify(combatArray, null, 4)));
            }

            checkOutfitCache(killerOutfit, worldID, function(aoutfitName, aoutfitTag, aoutfitFaction, aoutfitID) {
                combatArray.aOutfit = {};

                if (aoutfitName !== undefined) { // If returned
                    combatArray.aOutfit = {};
                    combatArray.aOutfit.id = aoutfitID;
                    combatArray.aOutfit.name = aoutfitName;
                    combatArray.aOutfit.tag = aoutfitTag;
                    combatArray.aOutfit.faction = aoutfitFaction;
                } else {
                    combatArray.aOutfit = {};
                    combatArray.aOutfit.id = "0";
                    combatArray.aOutfit.name = "No Outfit";
                    combatArray.aOutfit.tag = "";
                    combatArray.aOutfit.faction = "0";
                }

                if (config.debug.combat === true) {
                    console.log("Attacker Outfit Object Built");
                }

                checkOutfitCache(victimOutfit, worldID, function(voutfitName, voutfitTag, voutfitFaction, voutfitID) {
                    if (voutfitName !== undefined) { // If returned
                        combatArray.vOutfit = {};
                        combatArray.vOutfit.id = voutfitID;
                        combatArray.vOutfit.name = voutfitName;
                        combatArray.vOutfit.tag = voutfitTag;
                        combatArray.vOutfit.faction = voutfitFaction;
                    } else {
                        combatArray.vOutfit = {};
                        combatArray.vOutfit.id = "0";
                        combatArray.vOutfit.name = "No Outfit";
                        combatArray.vOutfit.tag = "";
                        combatArray.vOutfit.faction = "0";
                    }

                    // console.log(JSON.stringify(combatArray, null, 4));
                    sendResult("combat", combatArray, resultID);
                    sendWorld('Combat', JSON.stringify(combatArray), combatArray.worldID);

                    insertCombatRecord(message, resultID, combatArray, function() {
                        if (config.debug.combat === true) {
                            console.log("INSERTED COMBAT RECORD");
                        }

                        callback();
                    });
                });
            });
        });
    });

    addKillMonitor(killerID, victimID, "kill", message.timestamp, message.vehicle_id, 0, resultID, killerName, victimName);
}

function insertCombatRecord(message, resultID, combatArray, callback)
{
    if (resultID) { // Make sure result ID is valid first
        insertWeaponStats(message, resultID, combatArray);
        insertOutfitStats(resultID, combatArray);
        insertPlayerStats(resultID, combatArray);
        updateFactionStats(resultID, combatArray);

        if (config.toggles.classStats === true) {
            insertClassStats(resultID, combatArray);
        }

        if (config.debug.combat === true) {
            console.log(success("PROCESSED KILL FOR PLAYER: "+message.attacker_character_name+" - "+supplementalConfig.worlds[message.world_id]));
            console.log(notice("Player used weapon: "+message.weapon_id));
        }

        callback();
    } else {
        console.log(critical("NO VALID RESULT ID FOUND! - insertCombatRecord"));
    }
}

function insertWeaponStats(message, resultID, combatArray)
{
    var kill = 'killCount=killCount+1';
    var headshot = '';
    var teamkill = '';

    if (combatArray.teamkill === "1") {
        kill = '';
        teamkill = 'teamkills=teamkills+1';
    }

    if (combatArray.headshot === "1") {
        headshot = ', headshots=headshots+1';
    }

    var updateWeaponTotalsQuery = 'UPDATE ws_weapons_totals SET '+kill+teamkill+headshot+' WHERE weaponID="'+message.weapon_id+'" AND resultID='+resultID;

    dbQuery({q:updateWeaponTotalsQuery}, function(result) {
        var numTRows = result.affectedRows;

        var killInt = 1;

        if (combatArray.teamkill === 1) {
            killInt = 0;
        }

        if (numTRows === 0) {
            var weaponTArray = {
                resultID: resultID,
                weaponID: message.weapon_id,
                killCount: killInt,
                headshots: combatArray.headshot,
                teamkills: combatArray.teamkill
            };

            dbQuery({q:'INSERT INTO ws_weapons_totals SET ?', d:weaponTArray, f:updateWeaponTotalsQuery}, function() {
                if (config.debug.weapons === true) {
                    console.log('Inserted new record into ws_weapons_totals for alert #'+resultID);
                }
            });
        }

        var updateWeaponPlayerQuery = 'UPDATE ws_weapons SET '+kill+teamkill+headshot+' WHERE weaponID="'+message.weapon_id+'" AND playerID="'+message.attacker_character_id+'" AND resultID='+resultID;

        dbQuery({q:updateWeaponPlayerQuery}, function(result) {
            var numRows = result.affectedRows;

            if (numRows === 0) { // If new record
                var weaponAttackerArray = {
                    resultID: resultID,
                    playerID: message.attacker_character_id,
                    weaponID: message.weapon_id,
                    killCount: killInt,
                    headshots: combatArray.headshot,
                    teamkills: combatArray.teamkill
                };

                if (config.debug.weapons === true) {
                    console.log(weaponAttackerArray);
                }

                dbQuery({q:'INSERT INTO ws_weapons SET ?', d:weaponAttackerArray, f:updateWeaponPlayerQuery}, function() {
                    if (config.debug.weapons === true) {
                        console.log('Inserted new record into ws_weapons (attacker) for alert #'+resultID);
                    }
                });
            }
        });
    });
}

function insertOutfitStats(resultID, combatArray)
{
    var killOutfit = combatArray.attackerOutfit;
    var deathOutfit = combatArray.victimOutfit;
    var worldID = combatArray.worldID;

    if (outfitTotalsUpdates[resultID] === undefined) {
        outfitTotalsUpdates[resultID] = {};
    }

    if (outfitTotalsUpdates[resultID][killOutfit] === undefined) {
        outfitTotalsUpdates[resultID][killOutfit] = {
            outfitKills: 0,
            outfitDeaths: 0,
            outfitTKs: 0,
            outfitSuicides: 0,
            world: worldID,
            outfitName: combatArray.aOutfit.name,
            outfitTag: combatArray.aOutfit.tag,
            outfitFaction: combatArray.attackerFaction
        };
    }
    if (outfitTotalsUpdates[resultID][deathOutfit] === undefined) {
        outfitTotalsUpdates[resultID][deathOutfit] = {
            outfitKills: 0,
            outfitDeaths: 0,
            outfitTKs: 0,
            outfitSuicides: 0,
            world: worldID,
            outfitName: combatArray.vOutfit.name,
            outfitTag: combatArray.vOutfit.tag,
            outfitFaction: combatArray.victimFaction
        };
    }

    if (combatArray.teamkill === 1) { // TK
        outfitTotalsUpdates[resultID][killOutfit].outfitTKs++;
        outfitTotalsUpdates[resultID][deathOutfit].outfitDeaths++;
    } else if (combatArray.suicide === 1) { // If a suicide
        outfitTotalsUpdates[resultID][deathOutfit].outfitDeaths++;
        outfitTotalsUpdates[resultID][deathOutfit].outfitSuicides++;
    } else { // Normal kill
        outfitTotalsUpdates[resultID][killOutfit].outfitKills++;
        outfitTotalsUpdates[resultID][deathOutfit].outfitDeaths++;
    }
}

function insertPlayerStats(resultID, combatArray)
{
    var attackerID = combatArray.attackerID;
    var victimID = combatArray.victimID;
    var attackerOutfit = combatArray.attackerOutfit;
    var victimOutfit = combatArray.victimOutfit;
    var attackerFID = combatArray.attackerFaction;
    var victimFID = combatArray.victimFaction;
    var attackerName = combatArray.attackerName;
    var victimName = combatArray.victimName;
    var attackerBR = combatArray.attackerBR;
    var victimBR = combatArray.victimBR;
    var headshot = combatArray.headshot;
    var worldID = combatArray.worldID;

    /* If the names are missing, resolve them manually */

    var teamKill = 0;
    var suicide = 0;

    var aKillQuery = 'playerKills=playerKills+1';
    var aDeathQuery = '';
    var aTKQuery = '';
    var aSuicideQuery = '';
    var headshotQuery = '';

    var vDeathQuery = 'playerDeaths=playerDeaths+1';

    if (combatArray.headshot === 1) {
        aKillQuery = 'playerKills=playerKills+1, ';
        headshotQuery = 'headshots=headshots+1';
    }

    if (combatArray.teamkill === 1) {// If a TK
        aKillQuery = '';
        teamKill = 1;
        aTKQuery = 'playerTeamKills=playerTeamKills+1';

        if (config.debug.combat === true) {
            console.log("TEAM KILL - Player");
        }

        if (combatArray.headshot === 1) {
            headshotQuery = 'headshots=headshots+1, ';
        }
    } else if (combatArray.suicide === 1) { // Is it a suicide?
        aKillQuery = '';
        aDeathQuery = 'playerDeaths=playerDeaths+1, ';
        aSuicideQuery = 'playerSuicides=playerSuicides+1';
        vDeathQuery = '';
        suicide = 1;

        if (config.debug.combat === true) {
            console.log("SUICIDE - Player");
        }
    }

    var playerKills = 1;
    var playerDeaths = 0;

    if (teamKill === 1) {
        playerKills = 0;
    }

    if (suicide === 1) {
        playerDeaths = 1;
        playerKills = 0;
    }

    var attackerQuery = 'UPDATE ws_players SET playerBR = '+attackerBR+', '+aKillQuery+''+headshotQuery+''+aDeathQuery+''+aSuicideQuery+''+aTKQuery+' WHERE playerID="'+attackerID+'" AND resultID='+resultID;

    if (config.debug.combat === true) {
        console.log(critical(attackerQuery));
    }

    dbQuery({q:attackerQuery}, function(resultAttacker) {
        if (resultAttacker.affectedRows === 0) { // If new record for Attacker
            var attackerData = {
                resultID: resultID,
                playerID: attackerID,
                playerName: attackerName,
                playerOutfit: attackerOutfit,
                playerFaction: attackerFID,
                playerKills: playerKills,
                playerDeaths: playerDeaths,
                playerTeamKills: teamKill,
                playerSuicides: suicide,
                playerBR: attackerBR,
                headshots: headshot
            };

            dbQuery({q:'INSERT INTO ws_players SET ?', d:attackerData, f:attackerQuery}, function() {
                if (config.debug.combat === true) {
                    console.log(attackerData);
                    console.log('Inserted new player record (attacker) for alert #' + resultID);
                }
            });
        }
    });

    var attackerTotalQuery = 'UPDATE ws_players_total SET playerOutfit = "'+attackerOutfit+'", playerServer = '+worldID+', playerFaction = '+attackerFID+', playerBR = '+attackerBR+', '+aKillQuery+''+headshotQuery+''+aDeathQuery+''+aSuicideQuery+''+aTKQuery+' WHERE playerID="'+attackerID+'"';

    dbQuery({q:attackerTotalQuery}, function(resultAttackerTotal) {
        if (resultAttackerTotal.affectedRows === 0) { // If new total record for Attacker
            var attackerTotalData = {
                playerID: attackerID,
                playerName: attackerName,
                playerOutfit: attackerOutfit,
                playerFaction: attackerFID,
                playerKills: playerKills,
                playerDeaths: playerDeaths,
                playerTeamKills: teamKill,
                playerSuicides: suicide,
                headshots: headshot,
                playerBR: attackerBR,
                playerServer: worldID
            };

            dbQuery({q:'INSERT INTO ws_players_total SET ?', d:attackerTotalData, f:attackerTotalQuery}, function() {
                if (config.debug.combat === true) {
                    console.log(attackerTotalData);
                    console.log('Inserted new player total record (attacker) for alert #' + resultID);
                }
            });
        }
    });

    if (attackerID === victimID) { // Don't count them twice!
        if (config.debug.combat === true) {
            console.log("Attacker and Victim IDs are the same.");
        }
    } else {
        var victimQuery = 'UPDATE ws_players SET playerBR = '+victimBR+', '+vDeathQuery+' WHERE playerID="'+victimID+'" AND resultID='+resultID;

        if (config.debug.combat === true) {
            console.log(critical(victimQuery));
        }

        dbQuery({q:victimQuery}, function(resultVictim) {
            if (resultVictim.affectedRows === 0) { // If new record for Victim
                var victimData = {
                    resultID: resultID,
                    playerID: victimID,
                    playerOutfit: victimOutfit,
                    playerName: victimName,
                    playerFaction: victimFID,
                    playerKills: 0,
                    playerDeaths: 1,
                    playerTeamKills: 0,
                    playerSuicides: 0,
                    playerBR: victimBR,
                    headshots: 0
                };

                dbQuery({q:'INSERT INTO ws_players SET ?', d:victimData, f:victimQuery}, function() {
                    if (config.debug.combat === true) {
                        console.log(victimData);
                        console.log('Inserted new player record (victim) for alert #' + resultID);
                    }
                });
            }
        });

        var victimTotalQuery = 'UPDATE ws_players_total SET playerOutfit = "'+victimOutfit+'", playerServer = '+worldID+', playerFaction = '+victimFID+', playerBR = '+victimBR+', '+vDeathQuery+' WHERE playerID="'+victimID+'"';

        dbQuery({q:victimTotalQuery}, function(resultVictimTotal) {
            if (resultVictimTotal.affectedRows === 0) { // If new total record for Victim
                var victimTotalData = {
                    playerID: victimID,
                    playerName: victimName,
                    playerOutfit: victimOutfit,
                    playerFaction: attackerFID,
                    playerKills: 0,
                    playerDeaths: 1,
                    playerTeamKills: 0,
                    playerSuicides: 0,
                    playerBR: victimBR,
                    headshots: 0
                };

                dbQuery({q:'INSERT INTO ws_players_total SET ?', d:victimTotalData, f:victimTotalQuery}, function() {
                    if (config.debug.combat === true) {
                        console.log(victimTotalData);
                        console.log('Inserted new player total record (victim) for alert #' + resultID);
                    }
                });
            }
        });
    }
}

var factionUpdates = {};
var xpTotalsUpdates = {};
var outfitTotalsUpdates = {};
var classTotalsUpdates = {};
var classPlayerUpdates = {};

setInterval(function() {
    batchUpdateFactionStats(function() {
    });

    batchUpdateXpTotals(function() {
    });

    batchUpdateOutfitTotals(function() {
    });

    batchUpdateClassTotals(function() {
    });
}, 5000);

function batchUpdateFactionStats(callback)
{
    Object.keys(factionUpdates).forEach(function(key) {
        var object = clone(factionUpdates[key]); // The result object
        delete factionUpdates[key];

        if (config.debug.batch === true) {
            console.log(JSON.stringify(object, null, 4));
        }

        dbQuery({q:"UPDATE ws_factions SET killsVS=killsVS+"+object.killsVS+", killsNC=killsNC+"+object.killsNC+", killsTR=killsTR+"+object.killsTR+", deathsVS=deathsVS+"+object.deathsVS+", deathsNC=deathsNC+"+object.deathsNC+", deathsTR=deathsTR+"+object.deathsTR+", teamKillsVS=teamKillsVS+"+object.teamKillsVS+", teamKillsNC=teamKillsNC+"+object.teamKillsNC+", teamKillsTR=teamKillsTR+"+object.teamKillsTR+", suicidesVS=suicidesVS+"+object.suicidesVS+", suicidesNC=suicidesNC+"+object.suicidesNC+", suicidesTR=suicidesTR+"+object.suicidesTR+", headshotsVS=headshotsVS+"+object.headshotsVS+", headshotsNC=headshotsNC+"+object.headshotsNC+", headshotsTR=headshotsTR+"+object.headshotsTR+", totalKills=totalKills+"+object.totalKills+", totalDeaths=totalDeaths+"+object.totalDeaths+", totalTKs=totalTKs+"+object.totalTKs+", totalSuicides=totalSuicides+"+object.totalSuicides+", totalHeadshots=totalHeadshots+"+object.totalHeadshots+" WHERE resultID = "+key}, function() {
            if (config.debug.batch === true) {
                console.log('Factions updated for alert #' + key);
            }
        });
    });

    if (config.debug.batch === true) {
        console.log(success("BATCH FACTION UPDATE FOR ALERTS COMPLETE"));
    }

    callback();
}

function batchUpdateXpTotals(callback)
{
    Object.keys(xpTotalsUpdates).forEach(function(xpType) {
        var object = clone(xpTotalsUpdates);

        var updateTotalsQuery = 'UPDATE ws_xp_totals SET occurances=occurances+'+object[xpType]+' WHERE type = '+xpType;

        if (config.debug.batch === true) {
            console.log(updateTotalsQuery);
        }

        dbQuery({q:updateTotalsQuery}, function(result) {
            if (result.affectedRows === 0) { // If missing record
                console.log(notice("INSERTING XP TOTALS RECORD"));
                var xpArrayTotals = {
                    type: xpType,
                    occurances: 1
                };

                dbQuery({q:'INSERT INTO ws_xp_totals SET ?', d:xpArrayTotals, f: updateTotalsQuery}, function() {
                    if (config.debug.batch === true) {
                        console.log('Batch inserted into ws_xs_totals');
                    }
                });
            }
        });
    });

    if (config.debug.batch === true) {
        console.log(success("BATCH XP UPDATE FOR ALERTS COMPLETE"));
    }

    callback();
}

function batchUpdateOutfitTotals(callback)
{
    Object.keys(outfitTotalsUpdates).forEach(function(resultID) {
        Object.keys(outfitTotalsUpdates[resultID]).forEach(function(outfitID) {
            var object = clone(outfitTotalsUpdates[resultID][outfitID]);
            delete outfitTotalsUpdates[resultID][outfitID];

            var updateOutfitAlert = 'UPDATE ws_outfits SET outfitKills=outfitKills+'+object.outfitKills+', outfitDeaths=outfitDeaths+'+object.outfitDeaths+',outfitTKs=outfitTKs+'+object.outfitTKs+', outfitSuicides=outfitSuicides+'+object.outfitSuicides+' WHERE outfitID = "'+outfitID+'" AND resultID = '+resultID;

            dbQuery({q:updateOutfitAlert}, function(resultA) {
                if (resultA.affectedRows === 0) {
                    var outfitArrayKills = {
                        resultID: resultID,
                        outfitID: outfitID,
                        outfitName: object.outfitName,
                        outfitTag: object.outfitTag,
                        outfitFaction: object.outfitFaction,
                        outfitKills: object.outfitKills,
                        outfitDeaths: object.outfitDeaths,
                        outfitSuicides: object.outfitSuicides,
                        outfitTKs: object.outfitTKs
                    };

                    dbQuery({q:'INSERT INTO ws_outfits SET ?', d:outfitArrayKills, f:updateOutfitAlert}, function () {
                        if (config.debug.batch === true) {
                            console.log(success("Batch updated outfit totals for alert #" + resultID));
                        }
                    });
                }
            });

            // OUTFIT TOTALS

            var updateOutfitTotals = 'UPDATE ws_outfits_total SET outfitKills=outfitKills+'+object.outfitKills+', outfitDeaths=outfitDeaths+'+object.outfitDeaths+',outfitTKs=outfitTKs+'+object.outfitTKs+', outfitSuicides=outfitSuicides+'+object.outfitSuicides+' WHERE outfitID = "'+outfitID+'"';

            dbQuery({q:updateOutfitTotals}, function(resultB) {
                if (resultB.affectedRows === 0) {// If new record for Attacker
                    var outfitArrayKills = {
                        outfitID: outfitID,
                        outfitName: object.outfitName,
                        outfitTag: object.outfitTag,
                        outfitFaction: object.outfitFaction,
                        outfitKills: object.outfitKills,
                        outfitDeaths: object.outfitDeaths,
                        outfitSuicides: object.outfitSuicides,
                        outfitTKs: object.outfitTKs,
                        outfitServer: object.world
                    };

                    dbQuery({q:'INSERT INTO ws_outfits_total SET ?', d:outfitArrayKills, f: updateOutfitTotals}, function() {
                        if (config.debug.batch === true) {
                            console.log(success("Batch updated outfit totals for outfit #" + outfitID));
                        }
                    });
                }
            });
        });
    });

    if (config.debug.batch === true) {
        console.log(success("BATCH OUTFIT TOTALS UPDATE FOR ALERTS COMPLETE"));
    }
    callback();
}

function batchUpdateClassTotals(callback)
{
    Object.keys(classTotalsUpdates).forEach(function(resultID) {
        Object.keys(classTotalsUpdates[resultID]).forEach(function(classID) {
            var object = clone(classTotalsUpdates[resultID][classID]);
            delete classTotalsUpdates[resultID][classID];

            var updateLoadoutQuery = 'UPDATE ws_classes SET kills=kills+'+object.kills+', deaths=deaths+'+object.deaths+', teamkills=teamkills+'+object.teamkills+', suicides=suicides+'+object.suicides+' WHERE resultID = '+resultID+' AND classID = '+classID;

            dbQuery({q:updateLoadoutQuery}, function(result) {
                if (result.affectedRows === 0) {// If missing record
                    if (config.debug.classes === true) {
                        console.log(notice("INSERTING Class Attacker RECORD"));
                    }

                    var classArray = {
                        resultID : resultID,
                        classID: classID,
                        kills: object.kills,
                        deaths: object.deaths,
                        teamkills: object.teamkills,
                        suicides: object.suicides
                    };

                    dbQuery({q:'INSERT INTO ws_classes SET ?', d:classArray, f: updateLoadoutQuery}, function() {
                        if (config.debug.classes === true) {
                            console.log(success("Batch updated class totals for alert #" + resultID));
                        }
                    });
                }
            });
        });
    });

    Object.keys(classPlayerUpdates).forEach(function(resultID) {
        Object.keys(classPlayerUpdates[resultID]).forEach(function(classID) {
            Object.keys(classPlayerUpdates[resultID][classID]).forEach(function(playerID) {
                var object = clone(classPlayerUpdates[resultID][classID][playerID]);
                delete classPlayerUpdates[resultID][classID][playerID];

                var updatePlayerLoadoutQuery = 'UPDATE ws_classes_totals SET kills=kills+'+object.kills+', deaths=deaths+'+object.deaths+', teamkills=teamkills+'+object.teamkills+', suicides=suicides+'+object.suicides+' WHERE resultID = '+resultID+' AND classID = '+classID+' AND playerID = '+playerID;

                dbQuery({q:updatePlayerLoadoutQuery}, function(result) {
                    if (result.affectedRows === 0) { // If missing record
                        if (config.debug.classes === true) {
                            console.log(notice("INSERTING Class Player Totals RECORD"));
                        }

                        var classArray = {
                            resultID  : resultID,
                            playerID  : playerID,
                            classID   : classID,
                            kills     : object.kills,
                            deaths    : object.deaths,
                            teamkills : object.teamkills,
                            suicides  : object.suicides
                        };

                        dbQuery({q:'INSERT INTO ws_classes_totals SET ?', d:classArray, f:updatePlayerLoadoutQuery}, function() {
                            if (config.debug.classes === true) {
                                console.log(success("Batch updated class totals for class #" + classID + " - alert #"+resultID));
                            }
                        });
                    }
                });
            });
        });
    });

    if (config.debug.batch === true) {
        console.log(success("BATCH CLASS TOTALS UPDATE FOR ALERTS COMPLETE"));
    }

    callback();
}

function updateFactionStats(resultID, combatArray)
{
    var killerFID = parseInt(combatArray.attackerFaction);
    var victimFID = parseInt(combatArray.victimFaction);

    if (factionUpdates[resultID] === undefined) {
        factionUpdates[resultID] = {
            killsVS: 0,
            killsNC: 0,
            killsTR: 0,
            deathsVS: 0,
            deathsNC: 0,
            deathsTR: 0,
            teamKillsVS: 0,
            teamKillsNC: 0,
            teamKillsTR: 0,
            suicidesVS: 0,
            suicidesNC: 0,
            suicidesTR: 0,
            headshotsVS: 0,
            headshotsNC: 0,
            headshotsTR: 0,
            totalKills: 0,
            totalDeaths: 0,
            totalTKs: 0,
            totalSuicides: 0,
            totalHeadshots: 0
        };
    }

    /* If the names are missing, resolve them manually */

    if (killerFID === 1) {
        kFaction = "VS";
    } else if (killerFID === 2) {
        kFaction = "NC";
    } else if (killerFID === 3) {
        kFaction = "TR";
    }

    if (victimFID === 1) {
        vFaction = "VS";
    } else if (victimFID === 2) {
        vFaction = "NC";
    } else if (victimFID === 3) {
        vFaction = "TR";
    }

    if (combatArray.teamkill === 1) { // If a TK
        factionUpdates[resultID]['teamKills'+kFaction]++;
        factionUpdates[resultID]['deaths'+kFaction]++;
        factionUpdates[resultID]['totalTKs']++;
        factionUpdates[resultID]['totalDeaths']++;

        if (config.debug.combat === true) {
            console.log(critical("TK"));
        }
    } else if (combatArray.suicide === 1) { // Is it a suicide?
        if (killerFID === 0) { // If the faction is missing, use the victim
            kFaction = vFaction;
        }

        factionUpdates[resultID]['suicides'+kFaction]++;
        factionUpdates[resultID]['deaths'+kFaction]++;
        factionUpdates[resultID]['totalSuicides']++;
        factionUpdates[resultID]['totalDeaths']++;

        if (config.debug.combat === true) {
            console.log(warning("SUICIDE"));
        }
    } else { // Must be a kill then
        factionUpdates[resultID]['kills'+kFaction]++;
        factionUpdates[resultID]['deaths'+vFaction]++;
        factionUpdates[resultID]['totalKills']++;
        factionUpdates[resultID]['totalDeaths']++;

        if (config.debug.combat === true) {
            console.log(success("KILL"));
        }
        
        if (combatArray.headshot === 1) {
            factionUpdates[resultID]['headshots'+kFaction]++;
            factionUpdates[resultID]['totalHeadshots']++;
        }
    }

    if (config.debug.combat === true) {
        console.log(kFaction);
        console.log(vFaction);
        console.log("----");
    }
}

/* IDs
1 = Flash
2 = Sunderer
3 = Lightning
4 = Magrider
5 = Vanguard
6 = Prowler
7 = Scythe
8 = Reaver
9 = Mozie
10 = Liberator
11 = Galaxy
12 = Harasser
13 = Drop pod
14 = Valkrye
100 = AI Base Turret
127 = AA Base Turret
101 = AI Mana Turret
102 = AV Mana Turret
150 = AA Base Turret (non tower)
151 = AV Base Turret
1012 = Phoenix Missle
*/

var vehNanite = {
    1: 50,
    2: 200,
    3: 350,
    4: 450,
    5: 450,
    6: 450,
    7: 350,
    8: 350,
    9: 350,
    10: 450,
    11: 450,
    12: 150,
    14: 250,
    15: 200,
    101: 0,
    102: 0,
    127: 0,
    150: 0,
    151: 0,
    152: 0
};

function insertVehicleStats(message, resultID, combat)
{
    if (combat === 0) {// If  a combat message, ignore this shizzle.
        var killerID = message.attacker_character_id;
        var victimID = message.victim_character_id;

        var killerVID = message.attacker_vehicle_id;
        var victimVID = message.victim_vehicle_id;

        addKillMonitor(killerID, victimID, "vKill", message.timestamp, killerVID, victimVID, resultID, null, null);
    }
}

function insertExperience(message, resultID)
{
    var charID = message.character_id;
    var xpType = message.experience_id;
    var xpTypeInt = parseInt(message.experience_id);

    /*- XP -
    2 - Assist
    3 - Kill Spawn Assist
    4 - Heal Player
    5 - Heal Assist
    6 - MAX Repair
    7 - Revive
    8 - Kill Streak
    10 - Domination Kill
    11 - Revenge Kill (Nemesis)
    15 - Control Point Defend
    16 - Control Point Attack
    25 - Multiple Kill
    26 - Road Kioll
    29 - Kill Max
    34 - Resupply
    37 - Headshot
    51 - Squad Heal
    53 - Squad Revive
    54 - Squad Spot Kill
    55 - Squad Resupply
    56 - Squad Spawn (awarded to SL)
    142 - Squad MAX Repair (character->recipient)
    270 - Spawn Beacon Kill
    272 - Convert Capture point (attacking or defending)
    275 - Terminal Desruction
    276 - Terminal Repair
    278 - High Priority Kill
    279 - Extreme Menace Kill
    293 - Motion Detect (Non squad)
    294 - Squad Motion Spot
    370 - Motion Spotter Kill
    437 - Shield bubble kill
    438 - Shield repair (character->recpient)
    439 - Squad Shield Repair (character->recpient)
    554 - Flashbang Assist
    555 - Flashbang Squad Assist
    556 - Objective Guard Bonus
    557 - Objective Capture Bonus

    7 and 53 replace each other (revives)

    5428285306548271089 - Warcore
    "5428285306548272721" - Anioth

    Repairs replace each other.
    In order to get squad repair, a member of the squad has to be inside.

    character_name for healing is the person who heals, other_character_id is the person being healed

    54 - Squad spot kill awarded to the person who spotter the victim. Killer get's normal kill

    Spawn kills don't work. The Kill event get's removed instead of sending a spawn kill event

    Extreme Menace and Menace kills are time based

    High Priority Kill = 1000XP
    Extreme Menace Kill = 2000XP

    */

    var allowedXPTypes = [4,5,6,7,8,10,11,15,16,25,26,29,26,32,34,37,51,53,54,55,56,131,132,133,134,135,136,137,138,139,140,141,142,201,236,237,240,241,270,272,275,276,277,278,279,293,294,370,437,438,439,556,557,579,584,592,599,600,601,602,603,604,605,606,607,616,617,618,629,630,640,641,642,643,651,674,675];

    var typeCheck = allowedXPTypes.indexOf(xpTypeInt);

    if (typeCheck !== -1) {
        if (xpTotalsUpdates[xpType] === undefined) {
            xpTotalsUpdates[xpType] = 0;
        }

        xpTotalsUpdates[xpType]++;

        var updateQuery = 'UPDATE ws_xp SET occurances=occurances+1 WHERE playerID = "'+charID+'" AND resultID = '+resultID+' AND type = '+xpType;

        dbQuery({q:updateQuery}, function(result) {
            if (result.affectedRows === 0) { // If missing record
                if (config.debug.xpmessage === true) {
                    console.log(notice("INSERTING XP RECORD"));
                }

                var xpArray = {
                    playerID: charID,
                    resultID: resultID,
                    type: xpType,
                    occurances: 1
                };

                dbQuery({q:'INSERT INTO ws_xp SET ?', d:xpArray, f:updateQuery}, function() {
                    if (config.debug.xp === true) {
                        console.log('Inserted XP record for alert #' + resultID + ' - player #' + playerID);
                    }
                });
            }
        });
    }
}

function insertClassStats(resultID, combatArray)
{
    var attackerLoadout = combatArray.attackerLoadout;
    var victimLoadout   = combatArray.victimLoadout;
    var attackerID      = combatArray.attackerID;
    var victimID        = combatArray.victimID;

    if (classTotalsUpdates[resultID] === undefined) {
        classTotalsUpdates[resultID] = {};
    }

    if (classTotalsUpdates[resultID][attackerLoadout] === undefined) {
        classTotalsUpdates[resultID][attackerLoadout] = {
            kills: 0,
            deaths: 0,
            teamkills: 0,
            suicides: 0
        };
    }

    if (classTotalsUpdates[resultID][victimLoadout] === undefined) {
        classTotalsUpdates[resultID][victimLoadout] = {
            kills: 0,
            deaths: 0,
            teamkills: 0,
            suicides: 0
        };
    }

    /** PER PLAYER CLASS STATS */

    if (classPlayerUpdates[resultID] === undefined) {
        classPlayerUpdates[resultID] = {};
    }

    if (classPlayerUpdates[resultID][attackerLoadout] === undefined) {
        classPlayerUpdates[resultID][attackerLoadout] = {};
    }

    if (classPlayerUpdates[resultID][victimLoadout] === undefined) {
        classPlayerUpdates[resultID][victimLoadout] = {};
    }

    if (classPlayerUpdates[resultID][attackerLoadout][attackerID] === undefined) {
        classPlayerUpdates[resultID][attackerLoadout][attackerID] = {
            kills: 0,
            deaths: 0,
            teamkills: 0,
            suicides: 0
        };
    }

    if (classPlayerUpdates[resultID][victimLoadout][victimID] === undefined) {
        classPlayerUpdates[resultID][victimLoadout][victimID] = {
            kills: 0,
            deaths: 0,
            teamkills: 0,
            suicides: 0
        };
    }

    /**  **/

    if (combatArray.teamkill === 1) {
        classTotalsUpdates[resultID][attackerLoadout].teamkills++;
        classTotalsUpdates[resultID][victimLoadout].deaths++;

        classPlayerUpdates[resultID][attackerLoadout][attackerID].teamkills++;
        classPlayerUpdates[resultID][victimLoadout][victimID].deaths++;
    } else if (combatArray.suicide === 1) {
        classTotalsUpdates[resultID][victimLoadout].deaths++;
        classTotalsUpdates[resultID][victimLoadout].suicides++;

        classPlayerUpdates[resultID][victimLoadout][victimID].deaths++;
        classPlayerUpdates[resultID][victimLoadout][victimID].suicides++;
    } else { // Normal
        classTotalsUpdates[resultID][attackerLoadout].kills++;
        classTotalsUpdates[resultID][victimLoadout].deaths++;

        classPlayerUpdates[resultID][attackerLoadout][attackerID].kills++;
        classPlayerUpdates[resultID][victimLoadout][victimID].deaths++;
    }
}

function insertAchievement(message, resultID)
{
    var charID = message.character_id;
    var cheevoID = message.achievement_id;

    var updateCheevoQuery = 'UPDATE ws_achievements SET occurances=occurances+1 WHERE playerID ='+charID+' AND achievementID = '+cheevoID+' AND resultID ='+resultID;

    dbQuery({q:updateCheevoQuery}, function(resultAchievement) {
        if (resultAchievement !== undefined && resultAchievement.affectedRows === 0) { // If missing record
            var achievementArray = {
                playerID : charID,
                resultID: resultID,
                achievementID: cheevoID,
                occurances: 1
            };

            dbQuery({q:'INSERT INTO ws_achievements SET ?', d:achievementArray, f:updateCheevoQuery}, function() {
                if (config.debug.achievements === true) {
                    console.log('Inserted achievement for player #' + charID + ' - alert #' + resultID);
                }
            });
        }
    });
}

var populationPulls = {};

setInterval(function() {
    populationPulls = {};
}, 30000);

function insertPopulationStats(resultID, callback)
{
    var populationInstance = populationInstances[resultID];

    if (populationPulls[resultID] === undefined) {
        populationPulls[resultID] = true;

        var time = new Date().getTime();

        if (populationInstance !== undefined) {
            var popArray = {
                resultID  : resultID,
                timestamp : Math.round(time / 1000),
                worldID   : parseInt(populationInstance.world),
                zoneID    : parseInt(populationInstance.zone),
                popsVS    : parseInt(populationInstance.VS),
                popsNC    : parseInt(populationInstance.NC),
                popsTR    : parseInt(populationInstance.TR),
                popsTotal : parseInt(populationInstance.total)
            };

            sendResult("pops", popArray, resultID);

            dbQuery({q:'INSERT INTO ws_pops SET ?', d:popArray}, function() {
                if (config.debug.population) {
                    console.log(success("Inserted ws_pops data for Alert #"+resultID));
                }
            });
        }
    } else if (config.debug.population === true) {
        console.log(notice("Population Change out of range - Skipping"));
    }

    callback();
}

function sendResult(messageType, message, resultID) // Sends message to WS Clients
{
    var messageToSend = {};

    if (config.debug.responses === true) {
        console.log(notice("STARTING RESULT SEND"));
    }

    if (message) { // If Valid
        messageToSend.data = message;
        messageToSend.messageType = messageType;

        if (config.debug.responses === true) {
            console.log("WEBSOCKET TO RESULT #"+resultID+" MESSAGE:");
            console.log(messageToSend);
        }

        if (resultSubscriptions[resultID]) { // If script was too quick for subscription
            Object.keys(resultSubscriptions[resultID]).forEach(function(key) {
                var clientConnection = resultSubscriptions[resultID][key];

                clientConnection.send(JSON.stringify(messageToSend), function(error) {
                    if (error) {
                        delete clientConnections[clientConnection.id];
                        delete resultSubscriptions[resultID][clientConnection.id];

                        if (config.debug.clients === true) {
                            console.log(notice("Websocket connection closed - Total: "+Object.keys(clientConnections).length));
                        }
                        console.log(critical("Client Error: "+error));
                    }
                });
            });
        }

        if (config.debug.keepalive === true && messageType !== "keepalive") {
            console.log(notice("Message Sent to Result Websockets"));
        }
    }
}

function sendMonitor(messageType, message) // Sends message to WS Clients
{
    var messageToSend = {};

    if (message) {
        messageToSend.data = message;
        messageToSend.messageType = messageType;

        if (config.debug.clients === true) {
            console.log("WEBSOCKET MESSAGE:");
            console.log(messageToSend);
        }

        if (messageType === "alertStart" || messageType === "alertEnd" || messageType === "update") { // Send to monitor
            Object.keys(clientConnections).forEach(function(key) {
                var clientConnection = clientConnections[key];

                clientConnection.send(JSON.stringify(messageToSend), function(error) {
                    if (error) {
                        delete clientConnections[clientConnection.id];

                        console.log(critical("Websocket Monitor Error: "+error));
                    }
                });
            });
        }

        if (config.debug.keepalive === true && messageType !== "keepalive") {
            console.log(notice("Message Sent to Monitor Websockets"));
        }
    }
}

function sendAdmins(messageType, message) // Sends message to WS Clients
{
    var messageToSend = {};

    if (message) {
        messageToSend.data = message;
        messageToSend.messageType = messageType;

        if (config.debug.clients === true && messageType !== "perf") {
            console.log("WEBSOCKET MESSAGE:");
            console.log(messageToSend);
        }

        if (messageType === "perf") { // Send only to perf subs
            Object.keys(clientAdminPerfConnections).forEach(function(key) {
                var clientConnection = clientAdminPerfConnections[key];

                clientConnection.send(JSON.stringify(messageToSend), function(error) {
                    if (error) {
                        console.log(critical("Websocket Admin Error: "+error));
                        delete clientAdminPerfConnections[clientConnection.id];
                    }
                });
            });
        } else {
            Object.keys(clientAdminConnections).forEach(function(key) {
                var clientConnection = clientAdminConnections[key];

                clientConnection.send(JSON.stringify(messageToSend), function(error) {
                    if (error) {
                        console.log(critical("Websocket Admin Error: "+error));
                        delete clientAdminConnections[clientConnection.id];
                    }
                });
            });
        }

        if (config.debug.clients === true && messageType !== "perf" && messageType !== "keepalive") {
            console.log(notice("Message Sent to Admin Websockets"));
        }
    }
}

function sendWorld(messageType, message, world) // Sends message to WS Clients for world only
{
    var messageToSend = {};

    if (config.debug.responses === true) {
        console.log(notice("STARTING WORLD SEND"));
    }

    if (message) { // If Valid
        messageToSend.data = message;
        messageToSend.messageType = messageType;

        if (clientWorldDebugConnections[world]) { // If script was too quick for subscription
            Object.keys(clientWorldDebugConnections[world]).forEach(function(key) {
                var clientConnection = clientWorldDebugConnections[world][key];

                clientConnection.send(JSON.stringify(messageToSend), function(error) {
                    if (error) {
                        delete clientConnections[clientConnection.id];
                        delete clientWorldDebugConnections[world][clientConnection.id];

                        if (config.debug.clients === true) {
                            console.log(notice("Websocket connection closed - Total: "+Object.keys(clientConnections).length));
                        }
                        console.log(critical("Client Error: "+error));
                    }
                });
            });
        }

        if (config.debug.keepalive === true && messageType !== "keepalive") {
            console.log(notice("Message Sent to Result Websockets"));
        }
    }
}

// Pings connections to see if they're still alive
setInterval(function() {
    sendAll("keepalive", "ping!");
}, 5000);

function sendAll(messageType, message) // Sends message to WS Clients
{
    var messageToSend = {};

    if (message) { // If Valid
        messageToSend.data = message;
        messageToSend.messageType = messageType;

        Object.keys(clientConnections).forEach(function(key) {
            var clientConnection = clientConnections[key];

            clientConnection.send(JSON.stringify(messageToSend), function(error) {
                if (error) {
                    console.log(critical("Websocket Error: "+error));
                    delete clientConnections[clientConnection.id];
                }
            });
        });

        if (config.debug.clients === true && messageType !== "keepalive") {
            console.log(notice("Message Sent to All Websockets"));
            console.log(messageType);
        }
    }
}

function DateCalc(d)
{
    var year, month, day, hour, minute, seconds;

    year = String(d.getFullYear());
    month = String(d.getUTCMonth() + 1);
    hour = String(d.getUTCHours());
    minute = String(d.getUTCMinutes());
    seconds = String(d.getUTCSeconds());

    if (month.length === 1) {
        month = "0" + month;
    }
    day = String(d.getDate());
    if (day.length === 1) {
        day = "0" + day;
    }
    if (hour.length === 1) { // If needing a preceding 0
        hour = "0"+hour;
    }
    if (minute.length === 1) {
        minute = "0"+minute;
    }
    if (seconds.length === 1) {
        seconds = "0"+seconds;
    }

    return year+"-"+month+"-"+day+" "+hour+":"+minute+":"+seconds;
}

function findPlayerName(playerID, world, callback)
{
    world = parseInt(world);
    var url;

    if (playerID === false) {
        console.log(critical("FALSE PLAYER ID! WORLD: "+world));
        callback(false, false);
    } else {
        if (world >= 2000) {
            url = 'http://census.daybreakgames.com/s:'+config.serviceID+'/get/ps2ps4eu:v2/character/?character_id='+playerID;
        } else if(world >= 1000) {
            url = 'http://census.daybreakgames.com/s:'+config.serviceID+'/get/ps2ps4us:v2/character/?character_id='+playerID;
        } else {
            url = 'http://census.daybreakgames.com/s:'+config.serviceID+'/get/ps2:v2/character/?character_id='+playerID;
        }

        if (config.debug.census === true) {
            console.log("========== FINDING PLAYER NAME =========");
            console.log("INPUT :"+playerID);
        }

        http.get(url, function(res) {
            var body = '';

            res.on('data', function(chunk) {
                body += chunk;
            });

            res.on('end', function() {

                var success = 1;
                var returned;

                try {
                    returned = JSON.parse(body);
                }
                catch(exception) {
                    console.log(critical("BAD RETURN FROM CENSUS - Player Cache"));
                    console.log(url);
                    console.log(body);
                    success = 0;
                }

                if (success === 1) {
                    if (returned === undefined) {
                        console.log(critical("CENSUS NO DATA!"));
                        console.log(notice("QUERY: "+url));
                    }

                    if (returned.character_list !== undefined) {
                        var characterListLength = returned.character_list.length;

                        if (characterListLength === 0) {
                            console.log(critical("CENSUS RETURNED NO CHARACTERS!"));
                            console.log(notice("WORLD: "+world+" QUERY: "+url));
                        }

                        if (success === 1) {
                            var valid = parseInt(returned.returned);

                            if (valid === 1) {
                                if (config.debug.census === true) {
                                    console.log("RESPONSE: "+returned.character_list);
                                    console.log("INPUT :"+playerID);
                                }

                                var name = returned.character_list[0].name.first;
                                var faction = returned.character_list[0].faction_id;
                                var br = returned.character_list[0].battle_rank.value;

                                callback(name, faction, br);
                            } else {
                                if (config.debug.census === true) {
                                    console.log(warning("FAILED TO GET PLAYER NAME!"));
                                }

                                callback(false, false, false);
                            }
                        }
                    }
                } else {
                    console.log(warning("CENSUS API QUERY FAIL"));
                    console.log(notice("QUERY: "+url));
                }
            });
        }).on('error', function(e) {
            console.log("CENSUS QUERY ERROR: ", e);
            callback(false, false);
        });
    }
}

function findOutfitName(outfitID, world, callback)
{
    var url;
    if (outfitID === "-1" || outfitID === "0") {
        return "";
    }

    if (outfitID === false) {
        console.log(critical("OUTFIT ID IS FALSE!"));
    }

    if (world >= 2000) {
        url = 'http://census.daybreakgames.com/s:'+config.serviceID+'/get/ps2ps4eu:v2/outfit/?outfit_id='+outfitID;
    } else if (world >= 1000) {
        url = 'http://census.daybreakgames.com/s:'+config.serviceID+'/get/ps2ps4us:v2/outfit/?outfit_id='+outfitID;
    } else {
        url = 'http://census.daybreakgames.com/s:'+config.serviceID+'/get/ps2:v2/outfit/?outfit_id='+outfitID;
    }

    if (config.debug.census === true) {
        console.log("========== FINDING OUTFIT NAME =========");
        console.log("INPUT :"+outfitID);
    }

    http.get(url, function(res) {
        var body = '';

        res.on('data', function(chunk) {
            body += chunk;
        });

        res.on('end', function() {

            var success = 1;
            var returned;
            var valid = 0;

            try {
                returned = JSON.parse(body);
            }
            catch(exception) {
                console.log(critical("BAD RETURN FROM CENSUS - Outfit Cache"));
                success = 0;
            }

            if (success === 1) {
                valid = returned.returned;

                if (valid === 1) {
                    if (config.debug.census === true) {
                        console.log("RESPONSE: "+returned.outfit_list);
                        console.log("INPUT :"+outfitID);
                    }

                    var name = returned.outfit_list[0].name;
                    var tag = returned.outfit_list[0].alias;
                    var leader = returned.outfit_list[0].leader_character_id;

                    callback(name, tag, leader);
                } else {
                    if (config.debug.census === true) {
                        console.log(warning("FAILED TO GET OUTFIT NAME!"));
                        console.log(url);
                    }

                    callback(false, false, false);
                }
            }
        });
    }).on('error', function(e) {
        console.log("CENSUS OUTFIT ERROR:: ", e);
        callback(false, false, false);
    });
}

function checkPlayerCache(playerID, world, callback)
{
    dbQuery({q:'SELECT * FROM player_cache WHERE playerID="'+playerID+'"', p:'cache'}, function(result) {
        if (config.debug.cache === true) {
            console.log(notice("PLAYER CACHE RESULT: " + JSON.stringify(result[0], null, 4)));
        }

        if (!result[0]) {// If empty
            findPlayerName(playerID, world, function(name, faction, br) {
                if (name !== false && faction !== false) {
                    var now = Math.round(new Date().getTime() / 1000);
                    var cacheExpires = now + 10800; // 3 hours

                    var insertPArray = {
                        playerID: playerID,
                        playerName: name,
                        playerFaction: faction,
                        playerBR: br,
                        expires: cacheExpires
                    };

                    dbQuery({q:'INSERT INTO player_cache SET ?', d:insertPArray, p:'cache', f:null}, function() {
                        if (config.debug.cache === true) {
                            console.log(success("INSERTED PLAYER RECORD INTO CACHE TABLE"));
                        }

                        dbQuery({q:'UPDATE cache_hits SET cacheMisses=cacheMisses+1 WHERE dataType="PlayerCache"', p:'cache'}, function() {
                            callback(name, br);
                        });
                    });
                } else {
                    console.log(critical("CENSUS PLAYER QUERY FAILED! SEARCHED FOR PLAYER: "+playerID));
                    callback(false, false);
                }
            });
        } else if (result[0]) {
            if (config.debug.cache === true) {
                console.log(success("PLAYER CACHE HIT!"));
            }

            dbQuery({q:'UPDATE cache_hits SET cacheHits=CacheHits+1 WHERE dataType="PlayerCache"', p:'cache'}, function() {
                callback(result[0].playerName, result[0].playerBR);
            });
        }
    });
}

function checkOutfitCache(outfitID, worldID, callback)
{
    if (config.debug.cache === true) {
        console.log(critical("OUTFIT ID: "+outfitID));
    }

    if (outfitID === "-1" || outfitID === "0") {
        if (config.debug.cache === true) {
            console.log(critical("IGNORING OUTFIT PROCESSING"));
        }

        return callback(undefined, undefined, undefined, undefined);
    }

    dbQuery({q:'SELECT * FROM outfit_cache WHERE outfitID="'+outfitID+'"', p:'cache'}, function(result) {
        if (config.debug.cache === true) {
            console.log(notice("OUTFIT CACHE RESULT: " + JSON.stringify(result[0], null, 4)));
        }

        if (!result[0]) {// If empty
            findOutfitName(outfitID, worldID, function(outfitName, tag, leaderID) {
                if (config.debug.cache === true) {
                    console.log("FOUND OUTFIT NAME");
                }

                if (leaderID === false) {
                    if (config.debug.cache === true) {
                        console.log(critical("MISSING LEADER ID! Skipping cache."));
                    }
                    callback (false, false, false, false);
                }

                if (outfitName !== false) {
                    findPlayerName(leaderID, worldID, function(name, faction) {
                        var now = Math.round(new Date().getTime() / 1000);
                        var cacheExpires = now + 86400; // 1 Day

                        var insertOArray = {
                            outfitName: outfitName,
                            outfitTag: tag,
                            outfitFaction: faction,
                            outfitID: outfitID,
                            outfitWorld: worldID,
                            expires: cacheExpires
                        };

                        dbQuery({q:'INSERT INTO outfit_cache SET ?', d:insertOArray, p:'cache', f:null}, function() {
                            if (config.debug.cache === true) {
                                console.log(success("INSERTED OUTFIT RECORD INTO CACHE TABLE"));
                            }

                            dbQuery({q:'UPDATE cache_hits SET cacheMisses=cacheMisses+1 WHERE dataType="OutfitCache"', p:'cache'});
                            callback(outfitName, tag, faction, outfitID);
                        });
                    });
                } else {
                    if (config.debug.cache === true) {
                        console.log(critical("MISSING OUTFIT INFO! Skipping cache."));
                    }
                    callback(false, false, false, false);
                }
            });
        } else {
            dbQuery({q:'UPDATE cache_hits SET cacheHits=cacheHits+1 WHERE dataType="OutfitCache"', p:'cache'});

            if (config.debug.cache === true) {
                console.log(success("OUTFIT CACHE HIT!"));
            }

            callback(result[0].outfitName, result[0].outfitTag, result[0].outfitFaction, result[0].outfitID);
        }
    });
}

function calcWinners(message, resultID, Lresult, callback)
{
    dbQuery({q:"SELECT * FROM ws_results WHERE resultID="+resultID}, function(result) {
        console.log('result', result);
        console.log('Lresult', Lresult);
        if (!result[0]) { // If record is empty
            reportError("NO RESULT RECORD COULD BE FOUND! FOR ALERT #"+resultID, 'calcWinners', true);
        }

        if (Lresult.length === 0) {
            reportError("MISSING TERRITORY RECORDS FOR ALERT #"+resultID);
            return false;
        }

        if (Lresult[0].controlVS.length === 0 || Lresult[0].controlNC.length === 0 || Lresult[0].controlTR.length === 0) {
            reportError("MISSING FACTION CONTROL RECORDS / VALUES FOR ALERT #"+resultID);
            return false;
        }

        var winner = "TO CALC";
        var draw = 0;
        var domination = 0;
        var instance = instances[resultID];
        var time = new Date().getTime() / 1000; // Seconds convert

        var duration = parseInt(time) - parseInt(instance.startTime);

        var empires = [
            {
                score: parseInt(Lresult[0].controlVS),
                empire: 'VS'
            },
            {
                score: parseInt(Lresult[0].controlNC),
                empire: 'NC'
            },
            {
                score: parseInt(Lresult[0].controlTR),
                empire: 'TR'
            }
        ];

        // Sort by score
        empires.sort(function(a,b) {
            if (a.score < b.score) {
                return 1;
            }
            if (a.score > b.score) {
                return -1;
            }

            return 0;
        });

        // If Critical Mass Alert, calculate things differently
        if (message.type_id >= 123 && message.type_id <= 134) {
            calculateCriticalMassWinners(message, empires, Lresult[0], function(result) {
                winner = result;

                if (duration < 1790) { // If ended early, must be domination (somehow)
                    domination = 1;
                }
            });
        } else {
            winner = empires[0].empire; // Set the winner

            if (empires[0].score > 94) { // If cont lock, count as domination
                domination = 1;
            } else if (duration < 5390) { // If ended early, must be VP victory / domination
                domination = 1;
            } else if (empires[0].score === empires[1].score) {
                winner = "DRAW";
                draw = 1;
            }
        }

        console.log('Duration', duration);
        console.log('Domination:', domination);
        console.log("Draw:", draw);
        console.log(success("WINNER IS:", winner));

        callback(winner, draw, domination);
    });
}

function calculateCriticalMassWinners(message, empires, mapResult, callback)
{
    console.log('CALCULATING CRITICAL MASS WINNERS');

    APIAlertTypes(parseInt(message.type_id), function(result) {
        var metaInfo = result;
        var triggeringFactionWon = false;
        var winner = false;

        console.log('metaInfo', metaInfo);

        var triggeringFaction = metaInfo.faction;

        // Check if the triggering faction won as they need to keep 36% to win outright
        if (mapResult['control' + triggeringFaction] >= 36) {
            console.log('Triggering faction won!', triggeringFaction);
            triggeringFactionWon = true;
            winner = triggeringFaction;
        } else {
            // Check for the "bullshit zone" of 33-35% where the triggering empire could have "won" by excluding that empire
            winner = empires[0].empire;
            if (empires[0].score === empires[1].score) {
                winner = "DRAW";
            }
        }
        return callback([winner, triggeringFactionWon]);
    });
}

/* Helper Functions */

function APIAlertTypes(eventID, callback)
{
    var type = null;
    var cont = null;
    var zone = null;
    var faction = null;

    switch (eventID) {
        case 1:
            type = "Territory";
            cont = "Indar";
            zone = 2;
            break;
        case 2:
            type = "Territory";
            cont = "Esamir";
            zone = 6;
            break;
        case 3:
            type = "Territory";
            cont = "Amerish";
            zone = 4;
            break;
        case 4:
            type = "Territory";
            cont = "Hossin";
            zone = 8;
            break;
        case 5:
            type = "ERROR";
            cont = "ERROR";
            break;
        case 6:
            type = "ERROR";
            cont = "ERROR";
            break;
        case 7:
            type = "Bio";
            cont = "Amerish";
            zone = 4;
            break;
        case 8:
            type = "Tech";
            cont = "Amerish";
            zone = 4;
            break;
        case 9:
            type = "Amp";
            cont = "Amerish";
            zone = 4;
            break;
        case 10:
            type = "Bio";
            cont = "Indar";
            zone = 2;
            break;
        case 11:
            type = "Tech";
            cont = "Indar";
            zone = 2;
            break;
        case 12:
            type = "Amp";
            cont = "Indar";
            zone = 2;
            break;
        case 13:
            type = "Bio";
            cont = "Esamir";
            zone = 6;
            break;
        case 14:
            type = "Amp";
            cont = "Esamir";
            zone = 6;
            break;
        case 15:
            type = "Bio";
            cont = "Hossin";
            zone = 8;
            break;
        case 16:
            type = "Tech";
            cont= "Hossin";
            zone = 8;
            break;
        case 17:
            type = "Amp";
            cont = "Hossin";
            zone = 8;
            break;
        case 31:
            type = "Territory";
            cont = "Indar";
            zone = 2;
            break;
        case 32:
            type = "Territory";
            cont = "Esamir";
            zone = 6;
            break;
        case 33:
            type = "Territory";
            cont = "Amerish";
            zone = 4;
            break;
        case 34:
            type = "Territory";
            cont = "Hossin";
            zone = 8;
            break;
        case 123:
        case 124:
        case 125:
            type = "CriticalMass";
            cont = "Indar";
            zone = 2;
            break;
        case 126:
        case 127:
        case 128:
            type = "CriticalMass";
            cont = "Esamir";
            zone = 6;
            break;
        case 129:
        case 130:
        case 131:
            type = "CriticalMass";
            cont = "Hossin";
            zone = 8;
            break;
        case 132:
        case 133:
        case 134:
            type = "CriticalMass";
            cont = "Amerish";
            zone = 4;
            break;
    }

    switch (eventID) {
        case 124:
        case 127:
        case 130:
        case 133:
            faction = "VS";
            break;
        case 125:
        case 128:
        case 131:
        case 134:
            faction = "NC";
            break;
        case 123:
        case 126:
        case 129:
        case 132:
            faction = "TR";
            break;
    }

    var result = null;

    if (type && cont && zone) { // If valid
        result = {
            type: type,
            cont: cont,
            faction: faction,
            zone: zone
        };
    }

    callback(result);
}

var charFlags = {};
var charIDs = [];

function addKillMonitor(charID, vCharID, flag, timestamp, killerVID, victimVID, resultID, attName, vicName)
{
    if (!attName) {
        attName = false;
    }
    if (!vicName) {
        vicName = false;
    }

    if (!charFlags[charID]) {
        charFlags[charID] = {
            "charID": charID,
            "vCharID": vCharID,
            "timestamp": timestamp,
            "vKill": 0,
            "kill": 0,
            "killerVID": 0,
            "victimVID": 0,
            "resultID": resultID,
            "aName": attName,
            "vName": vicName
        };

        if (charIDs !== undefined) {
            charIDs.push(charID);
        } else {
            charIDs = charID;
        }
    }

    if (flag === "vKill") {
        if (charFlags[charID].vKill === 0) {
            charFlags[charID].killerVID = killerVID;
            charFlags[charID].victimVID = victimVID;
            charFlags[charID].vKill = 1;
        }
    }
    else if (flag === "kill") {
        if (charFlags[charID].kill === 0) {
            charFlags[charID].kill = 1;
            charFlags[charID].killerVID = killerVID;
        }
    }

    if (attName !== false && vicName !== false) {
        charFlags[charID].aName = attName;
        charFlags[charID].vName = vicName;
    }
}

setInterval(function() {
    for (var i = charIDs.length - 1; i >= 0; i--) { // Loop through all of the monitored characters
        var charID = charIDs[i];

        if (charFlags[charID]) {
            var killerVID = charFlags[charID].killerVID;
            var victimVID = charFlags[charID].victimVID;
            var resultID = charFlags[charID].resultID;
            var killerID = charFlags[charID].charID;
            var victimID = charFlags[charID].vCharID;

            if (charFlags[charID].kill === 1 && charFlags[charID].vKill === 1) { // Vehicle with Occ
                if (config.debug.vehicles === true) {
                    console.log(critical("VEHICLE KILL WITH OCCUPANT DETECTED!"));
                }

                incrementVehicleKills(1, killerVID, victimVID, resultID, killerID, victimID);
            } else if (charFlags[charID].kill === 0 && charFlags[charID].vKill === 1) { // Vehicle without Occ
                if (config.debug.vehicles === true) {
                    console.log(critical("VEHICLE KILL W/O OCCUPANT DETECTED"));
                }

                incrementVehicleKills(2, killerVID, victimVID, resultID, killerID, victimID);
            }
            else if (charFlags[charID].kill === 1 && charFlags[charID].vKill === 0) { // Normal Kill Occ
                if (config.debug.vehicles === true) {
                    console.log(critical("NORMAL KILL DETECTED"));
                }

                incrementVehicleKills(3, killerVID, 0, resultID, killerID, victimID);
            }
        } else {
            console.log("CHARFLAG DOESN'T EXIST!");
        }
    }

    charIDs = [];
    charFlags = [];

}, 1000);

function incrementVehicleKills(type, kID, vID, resultID, killerID, victimID)
{
    if (resultID !== undefined) {
        var Kquery;
        var Vquery;

        if (kID === 0) { // If the kill was by infantry
            switch(type) {
                case 1: {
                    type = 11;
                    break;
                }
                case 2: {
                    type = 22;
                    break;
                }
            }
        }

        var vehicleTotalKillObject = {
            vehicleID: kID,
            killCount: 1,
            killICount: 0,
            killVCount: 0,
            deathCount: 0,
            deathICount: 0,
            deathVCount: 0,
            bails: 0,
            resultID: resultID
        };

        var vehicleTotalDeathObject = {
            vehicleID: vID,
            killCount: 0,
            killICount: 0,
            killVCount: 0,
            deathCount: 1,
            deathICount: 0,
            deathVCount: 0,
            bails: 0,
            resultID: resultID
        };

        var vehiclePlayerKillObject = {
            vehicleID: kID,
            playerID: killerID,
            killCount: 1,
            killICount: 0,
            killVCount: 0,
            deathCount: 0,
            deathICount: 0,
            deathVCount: 0,
            bails: 0,
            resultID: resultID
        };

        var vehiclePlayerDeathObject = {
            vehicleID: vID,
            playerID: victimID,
            killCount: 0,
            killICount: 0,
            killVCount: 0,
            deathCount: 1,
            deathICount: 0,
            deathVCount: 0,
            bails: 0,
            resultID: resultID
        };

        var nanites = vehNanite[vID];

        switch(type) {
            case 1: { // V->V w/ Occ
                Kquery = "killCount=killCount+1, killVCount=killVCount+1";
                Vquery = "deathCount=deathCount+1, deathVCount=deathVCount+1";
                vehicleTotalKillObject.killVCount = 1;
                vehiclePlayerKillObject.killVCount = 1;
                vehicleTotalDeathObject.deathVCount = 1;
                vehiclePlayerDeathObject.deathVCount = 1;
                break;
            }
            case 11: { // I->V w/ Occ
                Vquery = "deathCount=deathCount+1, deathICount=deathICount+1";
                vehicleTotalDeathObject.deathICount = 1;
                vehiclePlayerDeathObject.deathICount = 1;
                break;
            }
            case 2: { // V->V no Occ
                Kquery = "killCount=killCount+1, killVCount=killVCount+1";
                Vquery = "deathCount=deathCount+1, deathVCount=deathVCount+1, bails=bails+1";
                vehicleTotalKillObject.killVCount = 1;
                vehiclePlayerKillObject.killVCount = 1;
                vehicleTotalDeathObject.deathVCount = 1;
                vehicleTotalDeathObject.bails = 1;
                vehiclePlayerDeathObject.deathVCount = 1;
                vehiclePlayerDeathObject.bails = 1;
                break;
            }
            case 22: { // I->V no Occ
                Vquery = "deathCount=deathCount+1, deathICount=deathICount+1, bails=bails+1";
                vehicleTotalDeathObject.deathICount = 1;
                vehicleTotalDeathObject.bails = 1;
                vehiclePlayerDeathObject.deathICount = 1;
                vehiclePlayerDeathObject.bails = 1;
                break;
            }
            case 3: { // V->I
                Kquery = "killCount=killCount+1, killICount=killICount+1";
                vehicleTotalKillObject.killICount = 1;
                vehiclePlayerKillObject.killICount = 1;
                break;
            }
        }

        if (kID !== 0) {
            var vKQueryT = "UPDATE ws_vehicles_totals SET "+Kquery+" WHERE vehicleID = "+kID+" AND resultID = "+resultID;
            // Killer Vehicle
            dbQuery({q:vKQueryT}, function(result) {
                if (result.affectedRows === 0) { // If no update happened, try again
                    dbQuery({q:"INSERT INTO ws_vehicles_totals SET ?", d:vehicleTotalKillObject, f:vKQueryT}, function() {
                        if (config.debug.vehicles === true) {
                            console.log("Inserted New Attacker Vehicle Total Record for alert #" + resultID);
                        }
                    });
                }
            });

            var vKQuery = "UPDATE ws_vehicles SET "+Kquery+" WHERE resultID = "+resultID+" AND playerID='"+killerID+"' AND vehicleID="+kID;

            dbQuery({q:vKQuery}, function(result) {
                if (result.affectedRows === 0) { // If no update happened, must be an insert
                    dbQuery({q:"INSERT INTO ws_vehicles SET ?", d:vehiclePlayerKillObject, f:vKQuery}, function() {
                        if (config.debug.vehicles === true) {
                            console.log("Inserted New Attacker Vehicle Total Record for alert #" + resultID);
                        }
                    });
                }
                var toSend = {
                    vehicleID: kID,
                    type: 'kill',
                    iMetric: vehicleTotalKillObject.killICount,
                    vMetric: vehicleTotalKillObject.killVCount,
                    resultID: resultID
                };

                sendResult("vehicleCombat", toSend, resultID);
            });
        }

        if (vID !== 0) {
            var vDQueryT = "UPDATE ws_vehicles_totals SET "+Vquery+" WHERE vehicleID ="+vID+" AND resultID = "+resultID;
            // Victim Vehicle
            dbQuery({q:vDQueryT}, function(result) {
                if (result.affectedRows === 0) { // If no update happened, must be an insert
                    dbQuery({q:"INSERT INTO ws_vehicles_totals SET ?", d:vehicleTotalDeathObject, f:vDQueryT}, function() {
                        if (config.debug.vehicles === true) {
                            console.log("Inserting New Victim Vehicle Total Record fort alert #" + resultID);
                            console.log(vID);
                            console.log(resultID);
                        }
                    });
                }
            });

            var vDQuery = "UPDATE ws_vehicles SET "+Vquery+" WHERE resultID = "+resultID+" AND playerID='"+victimID+"' AND vehicleID="+vID;

            dbQuery({q:vDQuery}, function(result) {
                if (result.affectedRows === 0) { // If no update happened, must be an insert
                    dbQuery({q:"INSERT INTO ws_vehicles SET ?", d:vehiclePlayerDeathObject, f:vDQuery}, function() {
                        if (config.debug.vehicles === true) {
                            console.log("Inserting New Victim Vehicle Record fort alert #" + resultID);
                            console.log(vID);
                            console.log(resultID);
                        }
                    });
                }
                var toSend = {
                    vehicleID: vID,
                    type: 'death',
                    iMetric: vehiclePlayerDeathObject.deathICount,
                    vMetric: vehiclePlayerDeathObject.deathVCount,
                    bail: vehiclePlayerDeathObject.bails,
                    nanites: nanites,
                    resultID: resultID
                };

                sendResult("vehicleCombat", toSend, resultID);
            });
        }
    }
}

function insertInitialMapData(data, callback)
{
    var worldID = String(data.world);
    var zoneID = String(data.zone);
    var resultID = String(data.resultID);

    var apiNamespace = "ps2:v2";

    if (worldID >= 2000) {
        apiNamespace = "ps2ps4eu:v2";
    } else if (worldID >= 1000) {
        apiNamespace = "ps2ps4us:v2";
    }

    console.log("API NAMESPACE: "+apiNamespace);

    var url = "http://census.daybreakgames.com/s:"+config.serviceID+"/get/"+apiNamespace+"/map/?world_id="+worldID+"&zone_ids="+zoneID;
    console.log("FIRING SCRIPT: "+url);

    http.get(url, function(res) {
        var body = '';

        res.on('data', function(chunk) {
            body += chunk;
        });

        res.on('error', function(e) {
            reportError(e, "Census Map Initial Query");
        });

        res.on('end', function() {

            var success = 1;
            var json;

            try {
                json = JSON.parse(body);
            }
            catch(exception) {
                console.log(critical("BAD RETURN FROM CENSUS - Map Initial"));
                console.log(url);
                console.log(body);
                success = 0;
            }

            if (success === 1) {
                console.log(json);
                var mapData = json["map_list"][0]["Regions"]["Row"];

                dbQuery({q:"SELECT * FROM facility_data WHERE zone = "+zoneID, p:'cache'}, function(data) {
                    var facData = {};

                    if (data[0] !== undefined) { // If someone came back

                        for (var i = data.length - 1; i >= 0; i--) {

                            var facilityMapID = data[i].facilityMapID;

                            facData[facilityMapID] = {
                                "facilityID": data[i].facilityID,
                                "facilityName": data[i].facilityName,
                                "facilityType": data[i].facilityType,
                                "zone": data[i].zone,
                                "facilityMapID": data[i].facilityMapID
                            };
                        }

                        Object.keys(mapData).forEach(function(key) {

                            var facilityMapID = mapData[key]["RowData"].RegionId;
                            var facilityData = facData[facilityMapID];

                            var object = {
                                worldID: worldID,
                                zoneID: zoneID,
                                facilityID: facilityData.facilityID,
                                facilityTypeID: facilityData.facilityType,
                                facilityOwner: mapData[key]["RowData"].FactionId,
                                resultID: resultID
                            };

                            dbQuery({q:"INSERT INTO ws_map_initial SET ?", d:object}, function() {
                                if (config.debug.mapinitial === true) {
                                    console.log("INSERTED MAP DATA FOR ALERT: #"+resultID);
                                }
                            });
                        });
                    } else {
                        reportError("No supplemental data returned!", "Insert Initial Map Data");
                    }
                });
            }

            var statusMessage = {
                type: "map",
                id: resultID
            };

            sendAdmins("eventStatus", statusMessage);

            var resultMessage = {
                id: resultID
            };

            sendResult("eventStatus", resultMessage);

            callback();
        });
    });
}

var messagesReceived = 0;
var messagesReceived30Sec = 0;
var forcedEndings = 0;

// Loop through instances checking that they're valid and are not due to be ending
function checkInstances(callback)
{
    var time = new Date().getTime();
    time = parseInt(time / 1000); // To convert to seconds

    if (config.debug.instances) {
        console.log(instances);
    }

    Object.keys(instances).forEach(function(resultID) {
        var world = instances[resultID].world;
        var zone = instances[resultID].zone;
        var overtime = instances[resultID].endTime + 10; // If end + 10 seconds

        if (config.debug.instances) {
            console.log('Time', time);
            console.log('Overtime', overtime);
        }

        // See if the alert is overdue
        if (time > overtime) { // If overdue
            var resultID = instances[resultID].resultID;

            console.log(critical("====================== ALERT #"+resultID+" OVERDUE!!!====================="));
            console.log("CHECKING TIME: "+time);
            console.log("RESULT TIME: "+instances[resultID].endTime); // Alert Time

            var endmessage = {// Fake the end message
                world_id: world,
                zone_id: zone,
                start_time: instances[resultID].startTime, // Needed for subscriptions
                end_time: instances[resultID].endTime
            };

            forcedEndings++;

            if (config.debug.metagame === true) {
                console.log(endmessage);
            }

            endAlert(endmessage, resultID, function(resultID) {
                console.log(critical("FORCEFULLY ENDED ALERT #"+resultID+" W: "+world+" - Z:"+zone));
                reportError("Forced Ended alert #"+resultID, "Check Instances");
            });
        }
    });

    callback();
}

function triggerLeaderboardUpdate(world) {
    // Tell the API to re-process the leaderboards.
    var url = 'http://api.ps2alerts.com/v2/leaderboards/update?server='+world;

    http.get(url, function(res) {
        if (res.statusCode === 202) {
            console.log(success("Successfully updated Leaderboard Endpoint for server:" + world))
        } else {
            console.log(critical("Leaderboard endpoint didn't accept update!"))
        }
    });
}

function fireSubscriptions(message, resultID, mode, event)
{
    var world = String(message.world_id);

    if (config.toggles.combat === true) {
        var combatMessage = '{"action":"'+mode+'","event":"Combat","worlds":["'+world+'"]}';
        //var combatMessage = '{"action":"'+mode+'","event":"Combat","worlds":["'+world+'"],"zones":["'+zone+'"]}';

        console.log(success(combatMessage));

        try {
            client.send(combatMessage);
        } catch (e) {
            console.log(critical("ERROR SENDING "+mode+" MESSAGE"));
            reportError("Error "+mode+" from API Socket - "+e, "Combat Message", true);
            return false;
        }
    }

    if (config.toggles.vehicledestroy === true) {
        var vehicleCombatMessage = '{"action":"'+mode+'","event":"VehicleDestroy","worlds":["'+world+'"]}';
        //var vehicleCombatMessage = '{"action":"'+mode+'","event":"VehicleDestroy","worlds":["'+world+'"],"zones":["'+zone+'"]}';

        console.log(success(vehicleCombatMessage));

        try {
            client.send(vehicleCombatMessage);
        } catch (e) {
            console.log(critical("ERROR SENDING "+mode+" MESSAGE"));
            reportError("Error "+mode+" from API Socket - "+e, "Vehicle Message", true);
            return false;
        }
    }

    if (config.toggles.facilitycontrol === true) {
        var facilityMessage = '{"action":"'+mode+'","event":"FacilityControl","worlds":["'+world+'"]}';
        //var facilityMessage = '{"action":"'+mode+'","event":"FacilityControl","worlds":["'+world+'"],"zones":["'+zone+'"]}';

        console.log(success(facilityMessage));

        try {
            client.send(facilityMessage);
        } catch (e) {
            console.log(critical("ERROR SENDING "+mode+" MESSAGE"));
            reportError("Error "+mode+" from API Socket - "+e, "Facility Message", true);
            return false;
        }
    }

    // Pop message moved to global scope.

    if (config.toggles.xpmessage === true) {
        var xpMessage = '{"action":"'+mode+'","event":"ExperienceEarned","worlds":["'+world+'"]}';
        //var xpMessage = '{"action":"'+mode+'","event":"ExperienceEarned","worlds":["'+world+'"],"zones":["'+zone+'"]}';

        console.log(success(xpMessage));

        try {
            client.send(xpMessage);
        } catch (e) {
            console.log(critical("ERROR SENDING "+mode+" MESSAGE"));
            reportError("Error "+mode+" from API Socket - "+e, "XP Message", true);
            return false;
        }
    }

    if (config.toggles.achievements === true) {
        var achievementMessage = '{"action":"'+mode+'","event":"AchievementEarned","worlds":["'+world+'"]}';
        //var achievementMessage = '{"action":"'+mode+'","event":"AchievementEarned","worlds":["'+world+'"],"zones":["'+zone+'"]}';

        console.log(success(achievementMessage));

        try {
            client.send(achievementMessage);
        } catch (e) {
            console.log(critical("ERROR SENDING "+mode+" MESSAGE"));
            reportError("Error "+mode+" from API Socket - "+e, "Achievements Message", true);
            return false;
        }
    }

    if (event !== true && mode === "subscribe") {
        setInstances(message, resultID);
    }
}

function setInstances(message, resultID)
{
    var zone = parseInt(message.zone_id);
    if (zone === 0) {
        console.log('Recalculating zone for setInstances');
        APIAlertTypes(parseInt(message.metagame_event_type_id), function(data) {
            zone = data.zone;
        });
    }
    instances[resultID] = {
        status:     true,
        resultID:   resultID,
        startTime:  parseInt(message.start_time),
        endTime:    calcEndTime(message.start_time, message.metagame_event_type_id),
        type:       parseInt(message.metagame_event_type_id),
        world:      parseInt(message.world_id),
        zone:       parseInt(zone),
        controlVS:  parseInt(message.control_vs),
        controlNC:  parseInt(message.control_nc),
        controlTR:  parseInt(message.control_tr),
        instanceID: parseInt(message.instance_id)
    };

    if (config.debug.instances) {
        console.log('instance created for result ' + resultID);
        console.log(instances[resultID]);
    }
}

function restoreSubs(callback)
{
    instances = {}; // Clear object if reconnected or being rebuilt

    dbQuery({q:'SELECT * FROM ws_instances'}, function(resultInstance) {
        console.log("INITIAL INSTANCE QUERY FIRED");

        var time = new Date().getTime() / 1000;

        for (var i = 0; i < resultInstance.length; i++) { // Loop through result array
            if (resultInstance[i].started < time) { // If it requires a subscription now
                var resultID   = parseInt(resultInstance[i].resultID);

                var message = {
                    world_id:               parseInt(resultInstance[i].world),
                    zone_id:                parseInt(resultInstance[i].zone),
                    start_time:             parseInt(resultInstance[i].started),
                    end_time:               0,
                    metagame_event_type_id: parseInt(resultInstance[i].type),
                    control_vs:             parseInt(resultInstance[i].controlVS),
                    control_nc:             parseInt(resultInstance[i].controlNC),
                    control_tr:             parseInt(resultInstance[i].controlTR),
                    instance_id:            parseInt(resultInstance[i].instanceID)
                };

                // Fake the message to send to the subscriptions function

                fireSubscriptions(message, resultID, "subscribe");
            } else {
                console.log(critical("Not firing subscription, before start of event."));
            }
        }

        callback();
    });
}

/* Weapon Grouping shizzle by Anioth */

var weaponMap = [];

function generate_weapons(callback)
{
    console.log("GENERATING WEAPONS!");

    dbQuery({q:"SELECT * FROM weapon_data", p:'cache'}, function(result) {
        var weaponFilterMap = {};

        for (var i = result.length - 1; i >= 0; i--) {
            //console.log(result[i]);
            var weapon = result[i];

            if (weaponFilterMap.hasOwnProperty(weapon.weaponName)) {
                weaponMap[weapon.weaponID] = {"id": weaponFilterMap[weapon.weaponName]};
            } else {
                weaponFilterMap[weapon.weaponName] = weapon.weaponID;
                weaponMap[weapon.weaponID] = {"id": weapon.weaponID};
            }
        }

        // Use the map to find a group
        //console.log("%j", weaponMap);

        //console.log("Looking for weapon id 1 %j", weaponMap[1]);

        callback();
    });
}


function combatHistory() // Called by generateActives function to log active alert history
{
    var date = new Date();
    var time = date.getTime();
    time = time / 1000; // Convert to websocket / PHP times

    if (messagesReceived30Sec > 1) {
        console.log(success("=========== GENERATING COMBAT HISTORY ==============="));

        Object.keys(instances).forEach(function(key) {
            var resultID = instances[key].resultID;

            dbQuery({q:"SELECT * FROM ws_factions WHERE resultID="+resultID}, function(result) {
                if (result[0]) { // If got a record
                    var total = parseInt(result[0].killsVS + result[0].killsNC + result[0].killsTR);

                    if (total !== 0) {
                        var post = {
                            resultID: resultID,
                            timestamp: time,
                            killsVS: result[0].killsVS,
                            killsNC: result[0].killsNC,
                            killsTR: result[0].killsTR
                        };

                        sendResult("combatHistory", post, resultID);

                        dbQuery({q:"INSERT INTO ws_combat_history SET ?", d:post}, function() {
                            if (config.debug.status === true) {
                                console.log(success("Inserted Combat History for Alert #"+resultID));
                            }
                        });
                    }
                } else {
                    console.log(critical("UNABLE TO RETRIEVE KILL COMBAT HISTORY FOR ALERT #"+resultID));
                }
            });
        });

        console.log(notice("Combat History Logged - "+date));
    }
}

/* Structure

messagesDuplicates =
{
    Combat :
    {
        123456789 : (timestamp)
        {
            54564545454545 (victim)
        }
    }
    Facility :
    {
        1 :(world ID)
        {
            2 : (zone)
            {
                200100 : (facilityID)
                {
                    123456789
                }
            }
        }
    }
    VehicleDestroy :
    {
        123456789 : (timestamp)
        {
            5546454545454 (victim)
        }
    }
}

if VictimID exists within combat message, discard the message


SAMPLE MESSAGE

FacilityMessage:
{
    "facility_id":"254030",
    "facility_type_id":"6",
    "outfit_id":"0",
    "duration_held":"52",
    "new_faction_id":"1",
    "old_faction_id":"2",
    "is_capture":"0",
    "control_vs":"44",
    "control_nc":"54",
    "control_tr":"1",
    "timestamp":"1424620307",
    "zone_id":"8",
    "world_id":"19"
    "event_type":"FacilityControl"
}
*/

var messagesDuplicates = {};

setInterval(function() {
    messagesDuplicates = {};
}, 2000);

function checkDuplicateMessages(message, callback)
{
    if (config.debug.duplicates) {
        console.log(warning("CHECKING FOR DUPLICATES START"));
        console.log(warning(JSON.stringify(message, null, 4)));
    }

    if (messagesDuplicates["Combat"] === undefined) {
        messagesDuplicates["Combat"] = {};
    }
    if (messagesDuplicates["FacilityControl"] === undefined) {
        messagesDuplicates["FacilityControl"] = {};
    }
    if (messagesDuplicates["VehicleDestroy"] === undefined) {
        messagesDuplicates["VehicleDestroy"] = {};
    }
    if (messagesDuplicates["MetagameEvent"] === undefined) {
        messagesDuplicates["MetagameEvent"] = {};
    }
    if (messagesDuplicates["ExperienceEarned"] === undefined) {
        messagesDuplicates["ExperienceEarned"] = {};
    }
    if (messagesDuplicates["AchievementEarned"] === undefined) {
        messagesDuplicates["AchievementEarned"] = {};
    }
    if (messagesDuplicates["PopulationChange"] === undefined) {
        messagesDuplicates["PopulationChange"] = {};
    }

    if (message.event_type !== undefined) {
        var eventType = message.event_type;
        var timestamp = parseInt(message.payload.timestamp);

        if (config.debug.duplicates === true) {
            console.log(warning("CHECKING FOR DUPLICATES"));
        }

        var status = false; // Duplicate unless proven otherwise

        if (eventType === "Combat") {
            var victimID = message.payload.victim_character_id;

            if (config.debug.duplicates === true) {
                console.log(warning("Checking Victim: "+victimID+" for duplicates"));
            }

            if (messagesDuplicates.Combat[victimID] === undefined) {
                messagesDuplicates.Combat[victimID] = {
                    timestamp: timestamp
                };

                status = true;
            } else if (messagesDuplicates.Combat[victimID].timestamp === timestamp) { // If a duplicate based off timestamp
                status = false;
            }
        }
        else if (eventType === "FacilityControl") {
            var facilityID = message.payload.facility_id;
            var blockUpdate = message.payload.is_block_update;

            if (config.debug.duplicates === true) {
                console.log(warning("Checking Facility: "+facilityID+" for duplicates"));
            }

            if (blockUpdate === "1") {
                status = true;
            } else {
                if (messagesDuplicates.FacilityControl[facilityID] === undefined) {
                    messagesDuplicates.FacilityControl[facilityID] = {
                        timestamp: timestamp
                    };

                    status = true;
                }
                else if (messagesDuplicates.FacilityControl[facilityID].timestamp === timestamp) { // If a duplicate based off timestamp
                    status = false;
                }
            }
        }
        else if (eventType === "VehicleDestroy")
        {
            var victimID = message.payload.victim_character_id;

            if (config.debug.duplicates === true) {
                console.log(warning("Checking Vehicle Victim: "+victimID+" for duplicates"));
            }

            if (messagesDuplicates.VehicleDestroy[victimID] === undefined) {
                messagesDuplicates.VehicleDestroy[victimID] = {
                    timestamp: timestamp
                };

                status = true;
            }
            else if (messagesDuplicates.VehicleDestroy[victimID].timestamp === timestamp) { // If a duplicate based off timestamp
                status = false;
            }
        }
        else if (eventType === "MetagameEvent") {
            status = true;
        }
        else if (eventType === "ExperienceEarned") {
            status = true;
        }
        else if (eventType === "AchievementEarned") {
            status = true;
        }
        else if (eventType === "PopulationChange") {
            status = true;
        }
        else if (eventType === "ServiceStateChange") {
            status = true;
        }
    } else { // If the message doesn't have an event type, let it through.
        status = true;
    }

    callback(status);
}

function calcEndTime(started, type) // Calculates estimated end time of an alert based off type and start time
{
    started = parseInt(started);
    type = parseInt(type);
    var toAdd = 0;

    switch(type) {
        case 1:
        case 2:
        case 3:
        case 4: {
            toAdd = 5400;
            break;
        }
        case 123:
        case 124:
        case 125:
        case 126:
        case 127:
        case 128:
        case 129:
        case 130:
        case 131:
        case 132:
        case 133:
        case 134: {
            toAdd = 2700;
            break;
        }
    }

    return started + toAdd;
}

// =================== SERVER ===============================

var clientConnections = {}; //Stores all connections to this server, and their subscribed events.
var connectionIDCounter = 0; //Connection Unique ID's.

var clientAdminConnections = {}; //Stores all connections to this server, and their subscribed events.
var clientAdminPerfConnections = {}; //Stores all connections to this server, and their subscribed events.
var clientWorldDebugConnections = {};

var resultSubscriptions = {}; // Stores all connections on a per-alert basis

var wss;

if (config.toggles.https) {
    // Set up the HTTPS server first before we pass on the websocket server
    const server = https.createServer({
        cert: fs.readFileSync('./certs/cert.pem', 'utf8'),
        key: fs.readFileSync('./certs/key.pem', 'utf8')
    }).listen(config.serverPort);

    wss = new WebSocket.Server({
        server: server
    });
} else {
    var WebSocketServer = require('ws').Server;

    wss = new WebSocketServer({
        port: config.serverPort,
        clientTracking: false //We do our own tracking.
    });
}

wss.on('connection', function(clientConnection) {
    if (config.debug.clients === true) {
        console.log("Processing incoming connection");
    }

    var apiKey = url.parse(clientConnection.upgradeReq.url, true).query.apikey;

    checkAPIKey(apiKey, function(isValid, username, admin) {
        if (config.debug.auth === true) {
            console.log("API Check Result: "+isValid);
        }

        if (!isValid) { // If API key is not valid or not authorised
            if (apiKey !== undefined) {
                console.log(critical("UNAUTHORISED API KEY ATTEMPT! "+apiKey));
                console.log(critical(JSON.stringify(message, null, 4)));
            } else if (config.debug.auth === true) {
                console.log(critical("INVALID API KEY FORMAT DETECTED."));
                console.log(critical("API KEY: "+apiKey));
            }

            clientConnection.close();
            return;
        }

        // Store a reference to the connection using an incrementing ID
        clientConnection.id = connectionIDCounter++;

        //Add to tracked client connections.
        clientConnections[clientConnection.id] = clientConnection;

        var message = {
            state: connectionState,
            admin: admin,
            response: 'auth'
        };

        clientConnection.send(JSON.stringify(message));

        if (config.debug.clients === true) {
            console.log(success("Websocket Connected - TOTAL: "+Object.keys(clientConnections).length));
            console.log((new Date()) + ' User ' + username + ' connected. API Key: ' + apiKey);
        }

        if (admin === true) {
            if (config.debug.admin === true) {
                console.log(success("Admin successfully authenticated!"));
            }

            clientAdminConnections[clientConnection.id] = clientConnection; // Subscribe admin to admin object
        }

        clientConnection.on('message', function(message) {
            try { // Check if the message we get is valid json.
                var parsedJson = JSON.parse(message);
                message = parsedJson.payload;
            }
            catch (exception) {
                console.log(JSON.stringify(message, null, 4));
                console.log(critical("INVALID JSON RECEIVED"));

                clientConnection.send('{"response":"Invalid Input"}');
                message = null;
            }

            if (!message) {
                console.log('MESSAGE WAS INVALID!');
                return;
            }

            if (message.action === "subscribe") { // Subscribe to result
                var resultID = message.resultID;

                if (!resultSubscriptions[resultID]) {
                    resultSubscriptions[resultID] = {};
                    resultSubscriptions[resultID][clientConnection.id] = clientConnection;
                } else {
                    resultSubscriptions[resultID][clientConnection.id] = clientConnection; // Put connection based on resultID into object to loop through
                }

                if (config.debug.clients === true) {
                    console.log(success("SUBSCRIBED WEBSOCKET TO ALERT #" + resultID));
                }

                clientConnection.send('{"messageType": "subscribed"}');
            } else if (message.action === 'subscribe-world') {
                console.log('Subscribing to world messages');
                var worldID = message.worldID;

                if (!clientWorldDebugConnections[worldID]) {
                    clientWorldDebugConnections[worldID] = {};
                    clientWorldDebugConnections[worldID][clientConnection.id] = clientConnection;
                } else {
                    clientWorldDebugConnections[worldID][clientConnection.id] = clientConnection; // Put connection based on worldID into object to loop through
                }

                if (config.debug.clients === true) {
                    console.log(success("SUBSCRIBED WEBSOCKET TO WORLD #" + worldID));
                }

                clientConnection.send('{"messageType": "subscribed"}');
            } else if (message.action === "timesync") {
                var clientTime = Math.floor(message.time);
                var resultID = message.resultID;
                var mode = message.mode;

                if (config.debug.time === true) {
                    console.log(notice("Time message recieved:"));
                    console.log(message);
                }

                if (instances[resultID]) { // On first load stuff, prevent crash
                    if (config.debug.time === true) {
                        console.log(critical("REQUESTED INSTANCE:"));
                        console.log(instances[resultID]);
                    }

                    var serverTime = new Date().getTime();
                    serverTime = Math.floor(serverTime / 1000);

                    if (config.debug.time === true) {
                        console.log("SERVER TIME: " + serverTime);
                    }

                    var diff = ( parseInt(clientTime) - parseInt(serverTime) );
                    var remaining = 0;

                    if (mode === "start") {
                        remaining = parseInt(instances[resultID].startTime) - serverTime;
                    } else if (mode === "end") {
                        remaining = parseInt(instances[resultID].endTime) - serverTime;
                    }

                    var correctTime = serverTime + remaining + diff;

                    //console.log(notice("Received Timesync message"));

                    clientConnection.send('{"messageType": "timeSync", "serverTime": ' + serverTime + ', "clientTime": ' + clientTime + ', "remaining": ' + remaining + ', "timediff":' + diff + ', "correctTime":' + correctTime + '}');

                    if (config.debug.time === true) {
                        console.log(success("SENDING TIME MESSAGE"));
                    } else if (config.debug.time === true) {
                        console.log(critical("SENDING TIMESYNC WAIT MESSAGE"));
                    }

                    clientConnection.send('{"messageType": "timeSyncWait"}');
                }
            } else if (message.action === "alertStatus") { // First call for the monitor
                var messageToSendMonitor = {};

                messageToSendMonitor.messageType = "alertStatus";

                var activeAlertsReply = {};

                var serverTime = new Date().getTime();
                serverTime = Math.floor(serverTime / 1000);

                Object.keys(instances).forEach(function (key) {
                    var world = instances[key]['world'];
                    var zone = instances[key]['zone'];

                    if (instances[key].status === true) { // If there's an active alert
                        if (!activeAlertsReply[world]) {
                            activeAlertsReply[world] = {};
                        }

                        activeAlertsReply[world][zone] = {};
                        activeAlertsReply[world][zone] = instances[key];

                        remaining = parseInt(instances[key].endTime) - serverTime;

                        activeAlertsReply[world][zone].remaining = remaining;
                        activeAlertsReply[world][zone].serverTime = serverTime;
                    }
                });

                messageToSendMonitor.data = activeAlertsReply;

                clientConnection.send(JSON.stringify(messageToSendMonitor));

                if (config.debug.clients === true) {
                    console.log(messageToSendMonitor);
                    console.log("SENT WEBSOCKET MONITOR CURRENT STATUS");
                }
            // ADMIN FUNCTIONS //
            } else if (message.type === "subscribePerf" && admin === true) { // Admin functions
                clientAdminPerfConnections[clientConnection.id] = clientConnection;
            } else if (message.type === "reloadPages" && admin === true) {
                sendResult("reload", "reload", message.resultID);
            } else if (message.action === "middlemanStatus") {
                console.log("Received middleman status request");

                var json = {
                    messageType: "middlemanStatus",
                    value: connectionState
                };

                clientConnection.send(JSON.stringify(json));
            }
        }); // End of clientOnMessage

        clientConnection.on('close', function() {
            delete clientConnections[clientConnection.id];

            if (clientAdminConnections[clientConnection.id]) {
                delete clientAdminConnections[clientConnection.id];
            }

            if (apiKey !== undefined) {
                if (config.debug.clients === true) {
                    console.log(notice("Websocket connection closed - Total: "+Object.keys(clientConnections).length));
                }
            }
        });
    }); // End of check API key
});

cleanCache();

/**
 * Cleans the cache store of all old data every 60 seconds
 *
 * @see cleanCache
 *
 */
setInterval(function() {
    cleanCache();
}, 60000);

//Connection Watcher - Reconnects if websocket connection is dropped.
function conWatcher()
{
    if(!wsClient.isConnected()) {
        console.log(critical('Reconnecting...'));

        var connectionState = 2;

        var message = {
            state: connectionState,
            admin: false,
            response: 'auth'
        };

        sendAdmins("status", message);

        wsClient = new persistentClient();
    }
}

/**
 * Watches subscription states. If they were never recieved, we restart the socket client.
 */
function subWatcher()
{
    if (wsClient.isConnected()) {
        if (subscriptions === 0) { // If the socket doesn't get a response from the API when subscriptions have been sent
            console.log(critical('SUBSCRIPTIONS NOT PASSED! RECONNECTING...'));
            subscriptionsRetry = 1;
            wsClient = new persistentClient();
        }
    }
}

/**
 * Cleans cache expiries out of the database
 *
 */
function cleanCache()
{
    console.log(notice("Running cache clean routine"));
    var expiry = Math.round(new Date().getTime() / 1000);

    dbQuery({q:"DELETE FROM outfit_cache WHERE expires <= "+expiry, p:'cache'}, function(result) {
        console.log("Outfit cache cleaned. Removed: "+result.affectedRows);
    });

    dbQuery({q:"DELETE FROM player_cache WHERE expires <= "+expiry, p:'cache'}, function(result) {
        console.log("Player cache cleaned. Removed: "+result.affectedRows);
    });
}

var maintInterval;

function setMaintenanceInterval() {
    var maintTimer = 30 * 1000;
    maintInterval = setInterval(function() {
        combatHistory(); // Log combat history for active alerts

        usage.lookup(pid, function(err, result) {
            if (result !== undefined) {
                var memory = Math.round(result.memory / 1024 / 1024);
                var cpu = Math.round(result.cpu);
                var clients = Object.keys(clientConnections).length;

                if (config.debug.perf === true) {
                    console.log(notice("============== PERFORMANCE =============="));
                    console.log("CPU: "+cpu+"% - MEM: "+memory+"MB - Clients: "+clients);
                    console.log("Messages 30: "+messagesReceived30Sec);
                    console.log("Messages Total: "+messagesReceived);
                    console.log(notice("========================================="));
                }

                perfStats = {
                    cpu: cpu,
                    mem: memory,
                    clients: clients,
                    msgTotal: messagesReceived,
                    msg30Sec: messagesReceived30Sec,
                    state: connectionState
                };

                sendAdmins("perf", perfStats);

                messagesReceived30Sec = 0;
            }
        });

        checkInstances(function() {
            if (config.debug.instances === true) {
                if (instances.length > 0) {
                    console.log(notice("=========== CURRENT ALERTS IN PROGRESS: ==========="));

                    Object.keys(instances).forEach(function(i) {
                        console.log('===== Result: ' + instances[i].resultID + ' =====');
                        console.log('W: ' + instances[i].world + ' - Z: ' + instances[i].zone);
                        console.log('VS: ' + instances[i].controlVS + ' - NC: ' + instances[i].controlNC + ' - TR: ' + instances[i].controlTR);
                        console.log('Remaining: ' + instances[i].remaining);
                    });
                }
            }
        });

        checkMapInitial(function() {
            if (config.debug.mapinitial === true) {
                console.log(notice("Map initial checked"));
            }
        });

        if (config.toggles.sync === true) {
            if (config.debug.sync === true) {
                console.log('Performing metagame event sync');
            }

            var actives = '{"action":"activeMetagameEvents"}'; // Pull a list of all active alerts

            try {
                client.send(actives);
            } catch (e) {
                reportError("Error: " + e, "Metagame Active Alerts message failed", true);
            }
        }
    }, maintTimer);
}

function processActives(message) {
    var worlds = message.worlds;

    if (config.debug.sync === true) {
        console.log('CURRENT INSTANCES:');
        console.log(JSON.stringify(instances, null, 4));
    }

    Object.keys(worlds).forEach(function(world) {
        Object.keys(worlds[world].metagame_events).forEach(function(a) {
            var instanceFound = false;
            var alert = worlds[world].metagame_events[a];
            var instanceID = parseInt(alert.instance_id);
            var zone = parseInt(alert.zone_id);

            if (!zone || zone === 0) {
                APIAlertTypes(parseInt(alert.metagame_event_type_id), function (data) {
                    zone = data.zone;
                });
            }

            if (config.debug.sync === true) {
                console.log("Instance ID", instanceID);
            }

            // Check for the instanceID in the instances object
            Object.keys(instances).forEach(function(resultID) {
                var localInstanceID = parseInt(instances[resultID].instanceID);
                if (config.debug.sync) {
                    console.log("Local Instance ID", localInstanceID);
                }

                if (localInstanceID === instanceID) {
                    if (config.debug.sync === true) {
                        console.log(success("Alert found"));
                        console.log(notice(JSON.stringify(instances[resultID], null, 4)));
                    }

                    instanceFound = true;
                }
            });

            // If instance was not found, force start
            if (instanceFound === false) {
                reportError("Sync detected missed alert! World: "+ world + " - Zone: " + zone, "Instance Sync");

                delete alert.facilities;

                if (config.debug.sync === true) {
                    console.log(critical(JSON.stringify(alert, null, 4)));
                }

                alert.world_id = world;

                console.log(notice("=== FORCE STARTING ALERT ON WORLD: " + world));

                insertAlert(alert, function(resultID) {
                    console.log(success("================ FORCE STARTED NEW ALERT #"+resultID+" ("+supplementalConfig.worlds[world]+") ================"));
                });
            }
        });
    });
}

function subscriptionDisplay(content, type, key, json) {
    if (!subscriptionDisplayContent[type]) {
        subscriptionDisplayContent[type] = '';
    }

    if (json) {
        subscriptionDisplayContent[type][key] = JSON.stringify(content, null, 4) + "\n";
    } else {
        subscriptionDisplayContent[type][key] = content + "\n";
    }

    if (subscriptionDisplayTimeout === null) {
        subscriptionDisplayTimeout = setTimeout(function() {
            console.log(notice('==== SUBSCRIPTIONS ===='));
            Object.keys(subscriptionDisplayContent).forEach(function(type) {
                console.log(type + " SUBSCRIPTIONS");
                Object.keys(subscriptionDisplayContent[type]).forEach(function(key) {
                    console.log(key);
                    console.log(subscriptionDisplayContent[key]);
                });
            });
            console.log(notice('======================='));
            clearTimeout(subscriptionDisplayTimeout);
            subscriptionDisplayTimeout = null;
            subscriptionDisplayContent = {};
        }, 2000)
    }
}