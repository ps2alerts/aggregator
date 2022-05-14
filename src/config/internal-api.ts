import {get} from '../utils/env';

export default class InternalApi {
    public readonly host = get('INTERNAL_API_HOST', 'http://ps2alerts-api:3000');
    public readonly username = get('INTERNAL_API_USER', 'ps2alerts');
    public readonly password = get('INTERNAL_API_PASS', 'foobar');
}