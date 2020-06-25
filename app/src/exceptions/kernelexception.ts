export default class KernelException {
    private _code: number;
    private _message: string;
    private _stack: string;

    get code(): number {
        return this._code;
    }

    set code(value: number) {
        this._code = value;
    }

    get message() {
        return this._message;
    }

    set message(value :string) {
        this._message = value;
    }

    get stack() {
        return this._stack;
    }

    set stack(value :string) {
        this._stack = value;
    }


}
