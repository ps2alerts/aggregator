import ApplicationException from './ApplicationException';

export default class IllegalArgumentException extends ApplicationException {
    public constructor(message: string) {
        super('IllegalArgument: ' + message);
    }
}
