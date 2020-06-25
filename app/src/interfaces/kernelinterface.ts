import KernelException from '../exceptions/kernelexception';

export default interface KernelInterface {
    /**
     * Starts running the app
     *
     * @return {Promise<void>}
     */
    run(): Promise<void>;

    /**
     * Terminates the app
     *
     * @return {Promise<void>}
     * @param err KernelException
     */
    terminate(err: KernelException): Promise<void>;
}
