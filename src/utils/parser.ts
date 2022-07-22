export default class Parser {
    public static parseNumericalArgument(argument: string | undefined | null, float = false): number {
        if (argument === null || argument === undefined) {
            return NaN;
        }

        return float ? parseFloat(argument) : parseInt(argument, 10);
    }
}
