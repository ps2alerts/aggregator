export function get(key: string, def = ''): string {
    return process.env[key]?.trim() ?? def;
}

export function getAndTest<T extends string>(key: string, test: (value: string) => boolean): T {
    const value = process.env[key];

    if (value && test(value)) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return value;
    }

    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Environment variable ${key} didn't match test ${test}`);
}

export function getBool(key: string, def = false): boolean {
    const value = process.env[key];

    if (value) {
        switch (value.trim().toUpperCase()) {
            case 'TRUE':
                return true;
            case 'FALSE':
                return false;
        }
    }

    return def;
}

export function getInt(key: string, def: number): number {
    const value = process.env[key];
    return value ? parseInt(value, 10) : def;
}
