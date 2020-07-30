# PS2Alerts Websocket

![Discord](https://img.shields.io/discord/708061542649954315?label=Discord) ![Ansible Linter](https://github.com/ps2alerts/websocket/workflows/Ansible%20Linter/badge.svg) ![ESLint](https://github.com/ps2alerts/websocket/workflows/ESLint/badge.svg) ![Yaml Linter](https://github.com/ps2alerts/websocket/workflows/Yaml%20Linter/badge.svg)

The websocket collection script that powers PS2Alerts.com.

**This project is undergoing a full rewrite**. If you wish to contribute, please join our Discord located at: https://discord.gg/7xF65ap

## Preface

This project powers the PS2Alerts website. Its primary purpose is to act as a Data Collector, which listens in on events coming in from [Census](https://census.daybreakgames.com) and formats that data into a legible format, commits it to a database, which in turn the [API](https://github.com/PS2Alerts/api) will serve to the [frontend website](https://github.com/PS2Alerts/website).

## Installation

Run `ps2alerts-start` to start all associated services and this module. Dependencies will be handled via the bootstrap process.

For first time runs, you must run `ps2alerts-websocket-start-full`, which goes ahead and builds the base image required for the dev Docker image to run.

To start the websocket for development, run `ps2alerts-websocket-dev`. This will bootstrap the container with ENV vars etc and tail the docker logs, as you would if you ran it manually via NPM.

### Local dependencies

For local development, you're recommended to have the following installed:

* [Node v10+](https://nodejs.org/en/download) recommend using NVM (node Version Manager)
* [NPM](https://www.npmjs.com/get-npm)
* npx `sudo npm install -g npx`

## Contributions

Please check the issues list for where you can contribute to this project. For more information, click on the Discord link above and have a chat with the developers.

# **Points of note**

If you don't quite understand IoC, I suggest you create an application as per the [Inversify tutorials](https://github.com/inversify/inversify-basic-example), hopefully it'll click. Feel free to ask any of the collaborators for help.

## File structure 

### `/app/src`

All application code is located within `/app/src`.

All provisioning and supported services are located within `/provisioning`. This includes the development environment, staging, and production build methods.

All pipelines are located within `./github/workflows`, which performs consistency tests and checks.

### `/bootstrap.ts`

This is where the IoC container is instantiated and told to load the modules via the Kernel, to return to `index.ts`

### `/index.ts`

This is where the fun begins. Index.ts loads the Kernel, which in turn loads the Container, which in turn sets everything up, and then once that's all running, listens for kernel level exceptions which we haven't caught within the application and logs it, then gracefully terminates the application.

### `/bootstrap`

Kernel.ts - herein lies the Kernel, essentially the container for the application. This boots and loads all services and is where everything begins.

### `/config`

Herein contains all the application config information, some of it hardcoded, some of it from env vars.

### `/exceptions `

Where our custom exceptions will exist. Currently have ApplicationException which provides a standard format.

### `/handlers`

Where the meat of the application will live. This is where all the event handlers will exist, e.g. DeathEvent. This is where all the processing, database updates, event emits etc will be triggered. This folder will get quite large eventually.

### `/interfaces`

This is where our code interfaces will live. E.g. each Handler will have an assoiciated parent Interface which each handler must adhere to. We will self-enforce usage of interfaces as it's simply **good coding practice**.

### `/logger`

Where the logging class exists. May move into a service instead, but the concept of a service for us isn't quite the same as what you may expect from say PHP services. It's more of a utility class.

### `/services`

This is where the census websocket subscriber currently exists. This may be expanded to be other services such as an Admin Message Service (I have the idea in my head where an admin can log into a backend and manually trigger an alert for special events etc)

### `/utils`

This is where utility classes / functions will live.

### `/validators`

This is where we will contain our validation classes. Currently this is simply just a world and Zone ID checkers to chuck out messages we either don't care about or don't support.
