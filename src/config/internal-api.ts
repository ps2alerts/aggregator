import {get} from '../utils/env';

export default class InternalApi {
    public readonly username = 'ps2alerts';
    public readonly host = get('API_BASE_URL', 'https://dev.api.ps2alerts.com');
    public readonly password = get('INTERNAL_API_PASS', 'foobar');
}
