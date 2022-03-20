import {inject, injectable} from 'inversify';
import PopulationHandlerInterface from '../interfaces/PopulationHandlerInterface';
import {TYPES} from '../constants/types';
import {getLogger} from '../logger';
import PopulationData from '../data/PopulationData';
import CharacterPresenceHandler from '../handlers/CharacterPresenceHandler';

@injectable()
export default class PopulationAuthority {
    private static readonly logger = getLogger('PopulationAuthority');
    private timer?: NodeJS.Timeout;
    private readonly populationHandler: PopulationHandlerInterface<PopulationData>;
    private readonly characterPresenceHandler: CharacterPresenceHandler;

    constructor(
    @inject(TYPES.populationHandler) populationHandler: PopulationHandlerInterface<PopulationData>,
                                     characterPresenceHandler: CharacterPresenceHandler,
    ) {
        this.populationHandler = populationHandler;
        this.characterPresenceHandler = characterPresenceHandler;
    }

    public run(): void {
        if (this.timer) {
            PopulationAuthority.logger.warn('Attempted to run PopulationAuthority timer when already defined!');
            this.stop();
        }

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.timer = setInterval(async () => {
            PopulationAuthority.logger.debug('Running PopulationAuthority presence collection');

            // Collect current population metrics from CharacterPresenceHandler
            const populationData = await this.characterPresenceHandler.collate();

            // Get instances, inject populations as recorded, call handlers
            populationData.forEach((data) => {
                void this.populationHandler.handle(data);
            });
        }, 60000);

        PopulationAuthority.logger.debug('Created PopulationAuthority timer');
    }

    public stop(): void {
        PopulationAuthority.logger.debug('Clearing PopulationAuthority timer');

        if (this.timer) {
            clearInterval(this.timer);
        }
    }
}
