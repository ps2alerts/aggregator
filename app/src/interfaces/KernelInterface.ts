/* eslint-disable */
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
     * @param code number
     */
    terminate(code:number): Promise<void>;
}
