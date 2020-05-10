# PS2Alerts-WebsocketServer
The websocket collection script that powers PS2Alerts.com.

## Preface

This is the start of updating and restructuring the websocket server for ps2alerts

## Installation

You will need the following technologies to run this application:

* MySQL / MariaDB (SQL Structure dump provided)
* NodeJS
* NPM

When you clone the rep, you'll need to run the following NPM command to acquire the modules required to run the Websocket Server:

```
Make sure your npm version are below 13.0 - recommend using 12.10.0, else some npm modules wont install
```
npm install - Install required npm modules
```
npm start - Starts the server
```

### Todos

* Create Models for each type of event to be store
* Code Cleanup
