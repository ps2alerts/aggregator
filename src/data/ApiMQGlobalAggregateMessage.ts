/* eslint-disable @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any */
import {Bracket} from '../constants/bracket';

export default class ApiMQGlobalAggregateMessage {
    public readonly pattern: string;
    public readonly data: { instance: string, bracket?: Bracket, docs: any[], conditionals?: any[]};

    constructor(endpoint: string, instance: string, docs: any[], conditionals: any[] = [], bracket?: Bracket) {
        this.pattern = endpoint;
        this.data = {
            instance,
            bracket,
            docs,
            conditionals,
        };
    }
}
