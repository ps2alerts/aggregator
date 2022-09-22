import {get} from '../utils/env';
import {random} from 'lodash';

export default class App {
    public readonly environment: string = get('NODE_ENV');
    public readonly version: string = get('VERSION');
    public readonly runId = random(1, 1337);
}
