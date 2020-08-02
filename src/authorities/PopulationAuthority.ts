import {inject, injectable} from 'inversify';
import PopulationData from '../data/PopulationData';
import PopulationHandlerInterface from '../interfaces/PopulationHandlerInterface';
import InstancePopulationData from '../data/InstancePopulationData';
import {TYPES} from '../constants/types';
import {getLogger} from '../logger';

injectable();
export default class PopulationAuthority {
    private static readonly logger = getLogger('PopulationAuthority');

    private readonly populations: PopulationData[] = [];

    private emitEventTimer: NodeJS.Timeout | null = null;

    private readonly populationHandler: PopulationHandlerInterface<InstancePopulationData>;

    constructor(@inject(TYPES.populationHandlerInterface) populationHandler: PopulationHandlerInterface<InstancePopulationData>) {
        this.populationHandler = populationHandler;
    }

    public run(): void {
        PopulationAuthority.logger.debug('Created PopulationAuthority timer');

        if (this.emitEventTimer) {
            PopulationAuthority.logger.error('Attempted to run OverdueInstanceAuthority timer when already defined!');
            clearInterval(this.emitEventTimer);
        }

        this.emitEventTimer = setInterval(() => {
            PopulationAuthority.logger.debug('Running OverdueInstanceAuthority overdue alert check');

            // Collect current population metrics from PlayerHandler

            // Get instances, inject populations as recorded, call handlers

            const event = new InstancePopulationData();

            this.populationHandler.handle(event);
        }, 30000);
    }

    public stop(): void {
        PopulationAuthority.logger.debug('Clearing OverdueInstanceAuthority timer');

        if (this.emitEventTimer) {
            clearInterval(this.emitEventTimer);
            this.emitEventTimer = null;
        }
    }
}
