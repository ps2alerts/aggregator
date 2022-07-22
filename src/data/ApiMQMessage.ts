/* eslint-disable @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any */
import ApiMQRabbitMessage from './ApiMQRabbitMessage';

export default class ApiMQMessage extends ApiMQRabbitMessage {
    public readonly data: { docs: any[], conditionals?: any[]};

    constructor(endpoint: string, docs: any[], conditionals: any[] = []) {
        super(endpoint);
        this.data = {
            docs,
            conditionals,
        };
    }
}
