/* eslint-disable @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any */
export enum ApiMQOperations {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
}

export default class ApiMQMessage {
    public readonly pattern: string;
    public readonly data: any[];

    constructor(endpoint: string, operation: ApiMQOperations, docs: any[]) {
        this.pattern = `${endpoint}.${operation}`;
        this.data = docs;
    }
}
