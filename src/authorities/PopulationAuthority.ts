import {inject, injectable} from 'inversify';
import PopulationHandlerInterface from '../interfaces/PopulationHandlerInterface';
import {TYPES} from '../constants/types';
import {getLogger} from '../logger';
import CharacterPresenceHandlerInterface from '../interfaces/CharacterPresenceHandlerInterface';
import PopulationData from '../data/PopulationData';

injectable();
export default class PopulationAuthority {
    private static readonly logger = getLogger('PopulationAuthority');

    private emitEventTimer: NodeJS.Timeout | null = null;

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
        PopulationAuthority.logger.debug('Created PopulationAuthority timer');

        if (this.emitEventTimer) {
            PopulationAuthority.logger.error('Attempted to run OverdueInstanceAuthority timer when already defined!');
            clearInterval(this.emitEventTimer);
        }

        this.emitEventTimer = setInterval(() => {
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
        PopulationAuthority.logger.debug('Clearing OverdueInstanceAuthority timer');

        if (this.emitEventTimer) {
            clearInterval(this.emitEventTimer);
            this.emitEventTimer = null;
        }
    }
}
