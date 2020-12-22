import ServiceInterface from '../../interfaces/ServiceInterface';
import {getLogger} from '../../logger';
import {injectable, multiInject} from 'inversify';
import {TYPES} from '../../constants/types';
import CensusStream from './CensusStream';

@injectable()
export default class CensusStreamService implements ServiceInterface {
    public readonly bootPriority = 10;
    private static readonly logger = getLogger('CensusStreamService');
    private readonly censusStreamServices: CensusStream[];

    constructor(@multiInject(TYPES.censusStreamServices) censusStreamServices: CensusStream[]) {
        this.censusStreamServices = censusStreamServices;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async boot(): Promise<void> {
        CensusStreamService.logger.debug('Booting Census Streams... (NOT IMPLEMENTED)');
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async start(): Promise<void> {
        CensusStreamService.logger.debug('Starting Census Streams...');
        this.censusStreamServices.map((stream: CensusStream) => {
            try {
                void stream.bootClient();
            } catch (e) {
                if (e instanceof Error) {
                    CensusStreamService.logger.error(`Error booting Census client! E: ${e.message}`);
                } else {
                    CensusStreamService.logger.error('UNEXPECTED ERROR booting Census client!');
                }
            }
        });
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public async terminate(): Promise<void> {
        CensusStreamService.logger.debug('Terminating Census Stream Service!');
    }
}
