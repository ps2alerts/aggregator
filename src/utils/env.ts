import * as process from 'process';

export function env(name: string): string | undefined;
export function env(name: string, def): string;
export function env(name: string, def?: string): string | undefined {
    return process.env[name] ?? def;
}

export function envInt(name: string, radix: number): number | undefined;
export function envInt(name: string, radix: number, def: number): number;
export function envInt(
    name: string,
    radix: number,
    def?: number,
): number | undefined {
    if (['inf', 'infinity'].includes(process.env[name]?.toLowerCase()))
        return Infinity;

    return parseInt(process.env[name], radix) || def;
}

export function envFloat(name: string): number | undefined;
export function envFloat(name: string, def: number): number;
export function envFloat(name: string, def?: number): number | undefined {
    return parseFloat(process.env[name]) || def;
}

export function envBool(name: string): boolean | undefined;
export function envBool(name: string, def: boolean): boolean;
export function envBool(name: string, def?: boolean): boolean | undefined {
    const val = process.env[name]?.toLowerCase();
    if (['true', 'false'].includes(val)) return val == 'true';

    return def;
}

export function envSplit(
    name: string,
    separator?: string,
): string[] | undefined;
export function envSplit(
    name: string,
    def: string[],
    separator?: string,
): string[];
export function envSplit(
    name: string,
    defOrSeparator?: string[] | string,
    separator?: string,
): string[] | undefined {
    let def: string[] = undefined;

    if (Array.isArray(defOrSeparator)) def = defOrSeparator;
    else separator = defOrSeparator;

    separator ??= ',';

    return process.env[name]?.split(separator) ?? def;
}
