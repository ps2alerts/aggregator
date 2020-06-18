"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('reflect-metadata');
const inversify_1 = require("inversify");
const kernel_1 = __importDefault(require("./kernel"));
// Initialize container
const app = new inversify_1.Container({
    autoBindInjectable: true,
    skipBaseClassChecks: true
});
// Bind container to app const
app.bind(inversify_1.Container).toConstantValue(app);
// Bind Kernel to the application
app.bind(kernel_1.default).toSelf().inSingletonScope();
// Load the modules required to run the app
// app.load(...config.app.modules);
// Export the app for running.
exports.default = app;
