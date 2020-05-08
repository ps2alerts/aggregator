# PS2Alerts-WebsocketServer
The websocket collection script that powers PS2Alerts.com.

## Preface

I'm fully aware that the websocket code is **not** well structured in the slightest. This project started when I had very little experience with JavaScript and I've simply never had the time to reformat it or restructure it. I've also not fully understood the concept behind NodeJS modules as of yet.

## Installation

You will need the following technologies to run this application:

* MySQL / MariaDB (SQL Structure dump provided)
* NodeJS
* NPM

When you clone the rep, you'll need to run the following NPM command to acquire the modules required to run the Websocket Server:

```
npm install ws mysql clone cli-color time usage
```

### Todos

* Strip out ServerSmash related code into either it's own branch or file.
* Code Cleanup
