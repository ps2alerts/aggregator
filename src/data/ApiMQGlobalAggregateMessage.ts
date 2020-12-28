/* eslint-disable @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any */
export default class ApiMQGlobalAggregateMessage {
    public readonly pattern: string;
    public readonly data: { instance: string, docs: any[], conditionals?: any[]};

    constructor(endpoint: string, instance: string, docs: any[], conditionals: any[] = []) {
        this.pattern = endpoint;
        this.data = {
            instance,
            docs,
            conditionals,
        };
    }
}
