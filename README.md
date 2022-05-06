# PS2Alerts Aggregator

![Discord](https://img.shields.io/discord/708061542649954315?label=Discord) ![Ansible Linter](https://github.com/ps2alerts/aggregator/workflows/Ansible%20Linter/badge.svg) ![ESLint](https://github.com/ps2alerts/aggregator/workflows/ESLint/badge.svg) ![Yaml Linter](https://github.com/ps2alerts/aggregator/workflows/Yaml%20Linter/badge.svg)

The aggregator collection script that powers PS2Alerts.com.

**This project is undergoing a full rewrite**. If you wish to contribute, please join our Discord located at: https://discord.gg/7xF65ap

## Preface

This project powers the PS2Alerts website. Its primary purpose is to act as a Data Collector, which listens in on events coming in from the [Census Stremaing Service](https://census.daybreakgames.com) and formats that data into a legible format, commits it to a database, which in turn the [API](https://github.com/PS2Alerts/api) will serve to the [frontend website](https://github.com/PS2Alerts/website).

## Installation

For first time runs, you must run `ps2alerts-aggregator-init`, which goes ahead and builds the base image required for the dev Docker image to run.

Run `ps2alerts-start` to start all associated services including this module. Dependencies will be handled via the bootstrap process.

To start the aggregator for development, run `ps2alerts-aggregator-dev`. This will bootstrap the container with ENV vars etc and tail the docker logs, as you would if you ran it manually via NPM.

#### Workarounds

On Mac OS X, [gyp has a hard dependency on XCode](https://medium.com/@Harry_1408/node-gyp-error-gyp-failed-with-exit-code-1-macos-npm-5aeaf75996d4). If you encounter the below error, you will need to install XCode :-/ 
```
 Error: `gyp` failed with exit code: 1
```

### Local dependencies

For local development, you're recommended to have the following installed:

* [Node v12+](https://nodejs.org/en/download) recommend using NVM (Node Version Manager)
* [NPM](https://www.npmjs.com/get-npm)

## Contributions

Please check the issues list for where you can contribute to this project. For more information, click on the Discord link above and have a chat with the developers.

# **Points of note**

If you don't quite understand IoC, I suggest you create an application as per the [Inversify tutorials](https://github.com/inversify/inversify-basic-example), hopefully it'll click. Feel free to ask any of the collaborators for help.

## File structure 

### `/src`

All application code is located within `/src`.

All provisioning and supported services are located within `/provisioning`. This includes the development environment, staging, and production build methods.

All pipelines are located within `./github/workflows`, which performs consistency tests and checks.

### `/src/bootstrap.ts`

This is where we instantiate the IoC container and load the Kernel modules.`

### `/src/index.ts`

This is where the fun begins. Index.ts loads the Kernel, which in turn loads the Container, which in turn sets everything up, and then once that's all running, listens for kernel level exceptions which we haven't caught within the application and logs it, then gracefully terminates the application.

### `/src/authorities`

This folder contains various subroutines which checks various things, e.g. shutting overdue alerts, population statistics gathering etc.

### `/src/bootstrap`

Kernel.ts - herein lies the Kernel, essentially the container for the application. This boots and loads all services and is where everything begins.

### `/src/config`

Herein contains all the application config information, some of it hardcoded, some of it from env vars.

### `/src/constants`

This folder contains all of our enumerates and static data / game data which is constant.

### `/src/data`

This is where our custom classes go, e.g. CharacterPresenceData.

### `/src/drivers`

Contains drivers which provide override functionality, e.g. CensusCacheDriver which implements Redis on behalf of the Census Package.

### `/src/exceptions`

Where our custom exceptions will exist. Currently has ApplicationException which provides a standard format.

### `/src/factories`

Contains various factories which create instantiated classes based on context. For example, Territory Calculator is finite, and this factory creates a new class for each scenario.

### `/src/handlers`

Where the meat of the application will live. This is where all the event handlers will exist, e.g. DeathEvent. This is where all the processing, database updates, event emits etc will be triggered. This folder will get quite large eventually.

It also contains useful services such as `CharacterBroker`, who's job is to go to Census and retrieve character information.

### `/src/instances`

Everything in PS2Alerts is driven around an instance. If there is no instance, it won't get recorded. Therefore, we have created the system to be able to define custom instance types, e.g. a Planetside Battles event on Jaeger. By default, we use the `PS2AlertsMetagameInstabce`. Each instance must implement the contained interface, which describes common attributes.

### `/src/interfaces`

This is where our code interfaces will live. E.g. each Handler will have an associated parent Interface which each handler must adhere to. We will self-enforce usage of interfaces as it's simply **good coding practice**.

### `/src/logger`

Where the logging class exists. May move into a service instead, but the concept of a service for us isn't quite the same as what you may expect from say PHP services. It's more of a utility class.

### `/src/models`

Herein lies all of our models which we use to interact with MongoDB. Each model instantiates from `/src/services/mongo/index.ts`, and within each model contains the collection structure, along with an interface which enforces certain data structure patterns.

### `/src/services`

This is where our services exist which are used throughout the application, such as connecting to Planetside 2's Census Streaming Service, Mongo and Redis connectivity.

### `/utils`

This is where utility classes / functions will live.
