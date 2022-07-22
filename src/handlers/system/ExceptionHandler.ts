// noinspection JSMethodCanBeStatic

import {getLogger} from '../../logger';

export default class ExceptionHandler {
    constructor(
        message: string,
        exception: unknown | Error,
        orgin: string,
    ) {
        this.throw(message, exception, orgin);
    }

    private throw(message: string, exception: unknown | Error, orgin: string): void {
        const logger = getLogger(orgin);

        logger.error(message);

        if (exception instanceof Error) {
            if (exception.stack) {
                logger.error(exception.stack);
            } else {
                logger.error(exception.message);
            }
        }

        throw exception;
    }
}
