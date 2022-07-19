export interface PS2AlertsQueueInterface {
    connect(): Promise<void>;
    destroy(): Promise<void>;
}
