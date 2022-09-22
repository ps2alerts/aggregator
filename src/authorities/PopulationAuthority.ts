import {Injectable, Logger} from '@nestjs/common';
import CharacterPresenceHandler from '../handlers/CharacterPresenceHandler';
import PopulationHandler from '../handlers/PopulationHandler';

@Injectable()
export default class PopulationAuthority {
    private static readonly logger = new Logger('PopulationAuthority');
    private timer?: NodeJS.Timeout;

    constructor(
        private readonly populationHandler: PopulationHandler,
        private readonly characterPresenceHandler: CharacterPresenceHandler,
    ) {}

    public run(): void {
        if (this.timer) {
            PopulationAuthority.logger.warn('Attempted to run PopulationAuthority timer when already defined!');
            this.stop();
        }

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.timer = setInterval(async () => {
            PopulationAuthority.logger.debug('Running PopulationAuthority presence collection');

            // Collect current population metrics from CharacterPresenceHandler
            try {
                const result = await this.characterPresenceHandler.collate();

                if (!result) {
                    PopulationAuthority.logger.debug('No pop data to collate!');
                    return;
                }

                // Get instances, inject populations as recorded, call handlers
                result.forEach((data) => {
                    void this.populationHandler.handle(data);
                });
            } catch (err) {
                if (err instanceof Error) {
                    PopulationAuthority.logger.error(`Population data collation failed! ${err.message}`);
                }
            }
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
