import ApplicationException from './ApplicationException';

export default class IllegalArgumentException extends ApplicationException {
    constructor(message: string) {
        super(`IllegalArgument: ${message}`);
    }
}
