"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var Kernel_1;
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const config_1 = __importDefault(require("./config"));
const logger_1 = require("./logger");
const runnable_1 = require("./bootstrap/runnable");
/**
 * Denotes the running states of the application.
 */
var RunningStates;
(function (RunningStates) {
    RunningStates[RunningStates["Idle"] = 0] = "Idle";
    RunningStates[RunningStates["Booting"] = 1] = "Booting";
    RunningStates[RunningStates["Running"] = 2] = "Running";
    RunningStates[RunningStates["Terminating"] = 3] = "Terminating";
})(RunningStates || (RunningStates = {}));
/**
 * The Kernel acts as the starting point of the application, loading services required in order for it to run, bit like an OS.
 */
let Kernel = Kernel_1 = class Kernel {
    /**
     * Constructor.
     * @param {Container} container for IoC
     * @param runnables
     */
    constructor(container, runnables) {
        this.container = container;
        this.state = RunningStates.Idle;
        this.runnables = runnables;
    }
    /**
     * Execute order 66 (run the app).
     */
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            // If already booting, stop here.
            if (this.state !== RunningStates.Idle) {
                return;
            }
            this.state = RunningStates.Booting;
            Kernel_1.logger.info("Hello world!");
            Kernel_1.logger.info(`Starting {version: ${Kernel_1.version}, environment: ${config_1.default.app.environment}}`);
            yield this.terminateWithError("Testing 123!", 1);
        });
    }
    /**
     * Terminates the app gracefully.
     * @param code
     */
    terminate(code = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            // If Idle or already terminating, we don't care as we're dead anyway sonny jim! :(
            if (this.state === RunningStates.Idle || this.state === RunningStates.Terminating)
                return;
            // Set app as terminating!
            this.state = RunningStates.Terminating;
            Kernel_1.logger.info(`TERMINATING! CODE: ${code}`);
            // Handle killing everything here
            process.exit(code);
        });
    }
    /**
     * Logs the error then proceeds to terminate.
     * @param err
     * @param code
     */
    terminateWithError(err, code = 1) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            Kernel_1.logger.error((_b = (_a = err.stack) !== null && _a !== void 0 ? _a : err.message) !== null && _b !== void 0 ? _b : err.toString());
            yield this.terminate(code);
        });
    }
};
Kernel.logger = logger_1.getLogger('kernel');
Kernel.version = '0.0.1';
__decorate([
    inversify_1.multiInject(runnable_1.RUNNABLE),
    __metadata("design:type", Array)
], Kernel.prototype, "runnables", void 0);
Kernel = Kernel_1 = __decorate([
    inversify_1.injectable(),
    __param(1, inversify_1.multiInject(runnable_1.RUNNABLE)),
    __metadata("design:paramtypes", [inversify_1.Container, Array])
], Kernel);
exports.default = Kernel;
