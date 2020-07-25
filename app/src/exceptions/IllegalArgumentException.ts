import ApplicationException from './ApplicationException';

export default class IllegalArgumentException extends ApplicationException {
    constructor(
        message: string,
        origin: string | null = null,
    ) {
        super(`IllegalArgument: ${message}`, origin);
        this.name = 'IllegalArgument';
    }
}
