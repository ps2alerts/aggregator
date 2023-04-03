// noinspection JSMethodCanBeStatic

import {Logger} from '@nestjs/common';

export default class ExceptionHandler {
    constructor(
        message: string,
        exception: unknown | Error,
        orgin: string,
    ) {
        this.throw(message, exception, orgin);
    }

    private throw(message: string, exception: unknown | Error, orgin: string): void {
        const logger = new Logger(orgin);

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
