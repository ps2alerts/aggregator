import {Injectable, Logger} from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export default class OutfitParticipantCacheHandler {
    private static readonly logger = new Logger('OutfitParticipantCacheHandler');
    private readonly keyNamespace = 'outfitParticipants';

    constructor(private readonly cacheClient: Redis) {}

    public async addOutfit(outfitId: string, characterId: string, instanceId: string): Promise<boolean> {
        await this.cacheClient.sadd(`${this.keyNamespace}:${instanceId}:${outfitId}`, characterId);

        // We need to keep a track of the sets in order to flush them at the end of the alert
        await this.cacheClient.sadd(`${this.keyNamespace}:list:${instanceId}`, outfitId);

        OutfitParticipantCacheHandler.logger.verbose(`Added O: ${outfitId} - I: ${instanceId} to outfit participant cache`);

        return true;
    }

    public async getOutfitParticipants(outfitId: string, instanceId: string): Promise<number> {
        return await this.cacheClient.smembers(`${this.keyNamespace}:${instanceId}:${outfitId}`).then((result) => {
            OutfitParticipantCacheHandler.logger.verbose(`${result?.length ?? 0} participants found for O: ${outfitId} - I: ${instanceId}`);
            return result?.length ?? 0;
        });
    }

    public async flushOutfits(instanceId: string): Promise<boolean> {
        // Get list of outfits we have on record for the instance
        await this.cacheClient.smembers(`${this.keyNamespace}:list:${instanceId}`).then(async (result) => {
            // Delete all instance participant outfit lists
            for (const outfitId of result) {
                await this.cacheClient.del(`${this.keyNamespace}:${instanceId}:${outfitId}`).then(() => {
                    OutfitParticipantCacheHandler.logger.verbose(`Deleted outfit ${outfitId} from outfit participant cache`);
                });
            }
        });

        // Finally, delete the instance level outfit list
        const count = await this.cacheClient.del(`${this.keyNamespace}:list:${instanceId}`);

        if (count === 0) {
            OutfitParticipantCacheHandler.logger.error(`Failed to delete all OutfitParticipants for instance ${instanceId}`);
        } else {
            OutfitParticipantCacheHandler.logger.debug(`Successfully deleted all OutfitParticipants for instance ${instanceId}`);
        }

        return !!count;
    }

    // Flushes all participants under the Redis namespace to ensure it's clean
    public async flushAll(): Promise<void> {
        const keys = await this.cacheClient.keys(`${this.keyNamespace}:*`);

        if (keys.length) {
            const deleted = await this.cacheClient.del(keys);
            OutfitParticipantCacheHandler.logger.debug(`Successfully flushed ${deleted} OutfitParticipants keys!`);
        }
    }
}
