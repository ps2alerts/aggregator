import ApplicationException from './ApplicationException';

export default class IllegalArgumentException extends ApplicationException {
    public constructor(message: string, origin: string | null = null) {
        super('IllegalArgument: ' + message, origin);
    }

}
