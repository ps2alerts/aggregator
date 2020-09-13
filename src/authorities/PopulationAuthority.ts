import {inject, injectable} from 'inversify';
import PopulationHandlerInterface from '../interfaces/PopulationHandlerInterface';
import {TYPES} from '../constants/types';
import {getLogger} from '../logger';
import CharacterPresenceHandlerInterface from '../interfaces/CharacterPresenceHandlerInterface';
import PopulationData from '../data/PopulationData';

@injectable()
export default class PopulationAuthority {
    private static readonly logger = getLogger('PopulationAuthority');

    private timer?: NodeJS.Timeout;

    private readonly populationHandler: PopulationHandlerInterface<PopulationData>;

    private readonly characterPresenceHandler: CharacterPresenceHandlerInterface;

    constructor(
    @inject(TYPES.populationHandlerInterface) populationHandler: PopulationHandlerInterface<PopulationData>,
        @inject(TYPES.characterPresenceHandlerInterface) characterPresenceHandler: CharacterPresenceHandlerInterface,
    ) {
        this.populationHandler = populationHandler;
        this.characterPresenceHandler = characterPresenceHandler;
    }

    public run(): void {
        if (this.timer) {
            PopulationAuthority.logger.error('Attempted to run PopulationAuthority timer when already defined!');
            this.stop();
        }

        PopulationAuthority.logger.debug('Creating PopulationAuthority timer');

        this.timer = setInterval(() => {
            PopulationAuthority.logger.debug('Running PopulationAuthority presence collection');

            // Collect current population metrics from CharacterPresenceHandlerInterface
            const populationData = this.characterPresenceHandler.collate();

            // Get instances, inject populations as recorded, call handlers
            populationData.forEach((data) => {
                void this.populationHandler.handle(data);

            });
        }, 60000);
    }

    public stop(): void {
        PopulationAuthority.logger.debug('Clearing PopulationAuthority timer');

        if (this.timer) {
            clearInterval(this.timer);
        }
    }
}
