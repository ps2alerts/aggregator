import {Container} from 'inversify';

export default interface ServiceInterface {
    /**
     * Run when booting the application
     *
     * @param {Container} container
     * @return {Promise<void>}
     */
    boot?(container: Container): Promise<void>;

    /**
     * Run when starting the application
     *
     * @param {Container} container
     * @return {Promise<void>}
     */
    start?(container: Container): Promise<void>;

    /**
     * Run when terminating the application
     *
     * @return void
     */
    terminate?(): void;
}

export const SERVICE: symbol = Symbol.for('interfaces.Service');
