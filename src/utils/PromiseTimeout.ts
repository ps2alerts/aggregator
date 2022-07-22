import TimeoutException from '../exceptions/TimeoutException';

export function promiseTimeout<T>(
    promise: Promise<T>,
    ms: number,
    timeoutError = new TimeoutException('Promise timed out'),
): Promise<T> {
    // create a promise that rejects in milliseconds
    const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => {
            reject(timeoutError);
        }, ms);
    });

    // returns a race between timeout and the passed promise
    return Promise.race<T>([promise, timeout]);
}
