import { Container } from 'inversify';

export default interface Service {
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
     * @return {Promise<void>}
     */
    terminate?(): Promise<void>;
}

export const SERVICE = Symbol.for('interfaces.Service');
