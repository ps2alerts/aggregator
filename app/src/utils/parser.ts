import IllegalArgumentException from '../exceptions/IllegalArgumentException';

export default class Parser {
    public static parseArgumentAsNumber(argument: string, float = false): number {
        if (argument === null || argument === undefined) {
            return NaN;
        }

        return float ? parseFloat(argument) : parseInt(argument, 10);
    }

    public static parseArgumentAsBoolean(argument: string): boolean {
        if (argument === null || argument === undefined) {
            throw new IllegalArgumentException('Argument cannot be null or undefined', 'Parser.parseArgumentAsBoolean');
        }
        return argument.toLowerCase() === 'true';
    }
}
