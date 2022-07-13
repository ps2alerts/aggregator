/* eslint-disable @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any */
import {Bracket} from '../ps2alerts-constants/bracket';
import ApiMQRabbitMessage from './ApiMQRabbitMessage';

export default class ApiMQGlobalAggregateMessage extends ApiMQRabbitMessage {
    public readonly data: { instance: string, bracket?: Bracket, docs: any[], conditionals?: any[]};

    constructor(endpoint: string, instance: string, docs: any[], conditionals: any[] = [], bracket?: Bracket) {
        super(endpoint);
        this.data = {
            instance,
            bracket,
            docs,
            conditionals,
        };
    }
}
