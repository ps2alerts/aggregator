"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function get(key, def = '') {
    var _a, _b;
    return (_b = (_a = process.env[key]) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : def;
}
exports.get = get;
function getBool(key, def = false) {
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
exports.getBool = getBool;
function getInt(key, def) {
    const value = process.env[key];
    return value ? parseInt(value) : def;
}
exports.getInt = getInt;
