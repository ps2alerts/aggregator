export default interface Runnable {
    boot?(): Promise<void>;

    start?(): Promise<void>;

    terminate?(): Promise<void>;
}

export const RUNNABLE = Symbol.for('bootstrap.Runnable');