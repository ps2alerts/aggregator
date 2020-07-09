export default class ApplicationException extends Error {
    private _message: string;

    private _origin: string|null;

    private _code: number|null;

    get message(): string {
        return this._message;
    }

    set message(value: string) {
        this._message = value;
    }

    get origin(): string|null{
        return this._origin;
    }

    set origin(value: string|null) {
        this._origin = value;
    }

    get code(): number|null {
        return this._code;
    }

    set code(value: number|null) {
        this._code = value;
    }

    constructor(message: string, origin: string|null = null, code: number|null = null) {
        super(message);
        this.message = message;
        this.origin = origin;
        this.code = code;
    }
}
