import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {injectable} from 'inversify';
import CensusStream from './CensusStream';

@injectable()
export default class CensusStreamService implements ServiceInterface {
    public readonly bootPriority = 10;
    private static readonly logger = getLogger('CensusStreamService');

    constructor(private readonly censusStream: CensusStream) {}

    // eslint-disable-next-line @typescript-eslint/require-await,@typescript-eslint/no-empty-function
    public async boot(): Promise<void> {}

    // eslint-disable-next-line @typescript-eslint/require-await
    public async start(): Promise<void> {
        CensusStreamService.logger.debug('Starting Census Stream...');

        try {
            await this.censusStream.bootClient();
        } catch (err) {
            if (err instanceof Error) {
                CensusStreamService.logger.error(`Error booting Census Stream! E: ${err.message}`);
            } else {
                CensusStreamService.logger.error('UNEXPECTED ERROR booting Census Stream!');
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/require-await,@typescript-eslint/no-empty-function
    public async terminate(): Promise<void> {}
}
