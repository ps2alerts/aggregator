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

* [Node v10+](https://nodejs.org/en/download) recommend using NVM (Node Version Manager)
* [NPM](https://www.npmjs.com/get-npm)
* Recommend to install npx `sudo npm install -g npx`

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

This is where the IoC container is instantiated and told to load the modules via the Kernel, to return to `index.ts`

### `/src/index.ts`

This is where the fun begins. Index.ts loads the Kernel, which in turn loads the Container, which in turn sets everything up, and then once that's all running, listens for kernel level exceptions which we haven't caught within the application and logs it, then gracefully terminates the application.

### `/src/authorities`

This folder contains various subroutines which checks various things, e.g. shutting overdue alerts, population statistics gathering etc.

### `/src/bootstrap`

Kernel.ts - herein lies the Kernel, essentially the container for the application. This boots and loads all services and is where everything begins.

### `/src/config`

Herein contains all the application config information, some of it hardcoded, some of it from env vars.

### `/src/constants`

This folder contains all of our enumuates and static data / game data which is constant.

### `/src/data`

This is where our custom classes go, e.g. CharacterPresenceData.

### `/src/drivers`

Contains drivers which provide override functionality, e.g. CensusCacheDriver which implements Redis on behalf of the Census Package.

### `/src/exceptions`

Where our custom exceptions will exist. Currently have ApplicationException which provides a standard format.

### `/src/factories`

Contains the MongooseModelFactory, which is where each of our MongoDB collections are dependant upon.

### `/src/handlers`

Where the meat of the application will live. This is where all the event handlers will exist, e.g. DeathEvent. This is where all the processing, database updates, event emits etc will be triggered. This folder will get quite large eventually.

It also contains useful services such as `CharacterBroker`, who's job is to go to Census and retrieve character information.

### `/instances`

Everything in PS2Alerts is driven around an instance. If there is no instance, it won't get recorded. Therefore, we have created the system to be able to define custom instance types, e.g. a Planetside Battles event on Jaeger. By default, we use the `PS2AlertsMetagameInstabce`. Each instance must implement the contained interface, which describes common attributes.

### `/interfaces`

This is where our code interfaces will live. E.g. each Handler will have an assoiciated parent Interface which each handler must adhere to. We will self-enforce usage of interfaces as it's simply **good coding practice**.

### `/logger`

Where the logging class exists. May move into a service instead, but the concept of a service for us isn't quite the same as what you may expect from say PHP services. It's more of a utility class.

### `/models`

Herein lies all of our models which we use to interact with MongoDB. Each model is instantiated from `/src/services/mongo/index.ts`, and within each model contains the collection structure, along with an interface which enforces certain data structure patterns.

### `/services`

This is where the census websocket subscriber currently exists. This may be expanded to be other services such as an Admin Message Service (I have the idea in my head where an admin can log into a backend and manually trigger an alert for special events etc)

### `/utils`

This is where utility classes / functions will live.
