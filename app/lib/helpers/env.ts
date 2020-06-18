export function get(key: string, def = ''): string {
    return process.env[key]?.trim() ?? def;
}

export function getBool(key: string, def = false): boolean {
    const value = process.env[key];

    if (value)
        switch (value.trim().toUpperCase()) {
            case 'TRUE':
                return true;
            case 'FALSE':
                return false;
        }

    return def;
}

export function getInt(key: string, def: number): number {
    const value = process.env[key];
    return value ? parseInt(value) : def;
}