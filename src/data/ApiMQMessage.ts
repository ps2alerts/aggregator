/* eslint-disable @typescript-eslint/explicit-module-boundary-types,@typescript-eslint/no-explicit-any */
export enum ApiMQOperations {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
}

export default class ApiMQMessage {
    public readonly pattern: string;
    public readonly operation: ApiMQOperations;
    public readonly body: any;

    constructor(pattern: string, operation: ApiMQOperations, body: any) {
        this.pattern = pattern;
        this.operation = operation;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.body = body;
    }
}
