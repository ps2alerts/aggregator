/* eslint-disable @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any */
export default class ApiMQMessage {
    public readonly pattern: string;
    public readonly data: { docs: any[], conditionals?: any[]};

    constructor(endpoint: string, docs: any[], conditionals: any[] = []) {
        this.pattern = endpoint;
        this.data = {
            docs,
            conditionals,
        };
    }
}
