export default class Parser {
    public static parseNumericalArgument(argument: string, float = false): number {
        if (argument === null || argument === undefined) {
            return NaN;
        }

        return float ? parseFloat(argument) : parseInt(argument, 10);
    }
}
