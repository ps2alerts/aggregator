# PS2Alerts Websocket
The websocket collection script that powers PS2Alerts.com.

THIS PROJECT IS UNDERGOING A VAST RE-REWITE. If you wish to contribute, please join our Discord located at: https://discord.gg/7xF65ap

## Preface

This is the start of updating and restructuring the websocket server for ps2alerts

## Installation

Run `ps2alerts-start` to start all associated services and this module. Dependencies will be handled via the bootstrap process.

To start the websocket for development, run `ps2alerts-websocket-dev`. This will bootstrap the container with ENV vars etc and tail the docker logs, as you would if you ran it manually via NPM.

For local development, you're recommended to have the following installed:

* [NPM](https://www.npmjs.com/get-npm)
* npx `sudo npm install -g npx`

## Contributions

Please check the issues list for where you can contribute to this project. For more information, click on the Discord link above and have a chat with the developers.
