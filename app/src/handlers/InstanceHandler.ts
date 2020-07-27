import {inject, injectable} from 'inversify';
import InstanceHandlerInterface from '../interfaces/InstanceHandlerInterface';
import MetagameEventEvent from './census/events/MetagameEventEvent';
import {jsonLogOutput} from '../utils/json';
import {getLogger} from '../logger';
import ApplicationException from '../exceptions/ApplicationException';
import {InstanceSchemaInterface} from '../models/InstanceModel';
import {MetagameEventState} from '../constants/metagameEventState';
import {getUnixTimestamp} from '../utils/time';
import {instanceId} from '../utils/instance';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import {TYPES} from '../constants/types';
import ActiveInstanceAuthority from '../authorities/ActiveInstanceAuthority';

@injectable()
export default class InstanceHandler implements InstanceHandlerInterface {

    private static readonly logger = getLogger('InstanceHandler');

    private readonly factory: MongooseModelFactory<InstanceSchemaInterface>;

    private readonly activeInstanceAuthority: ActiveInstanceAuthority;

    constructor(@inject(TYPES.instanceModelFactory) factory: MongooseModelFactory<InstanceSchemaInterface>,
                                                    activeInstanceAuthority: ActiveInstanceAuthority,
    ) {
        this.factory = factory;
        this.activeInstanceAuthority = activeInstanceAuthority;
    }

    public async handleMetagameEvent(mge: MetagameEventEvent): Promise<boolean> {
        if (mge.eventState === MetagameEventState.STARTED) {
            if (!this.activeInstanceAuthority.instanceExists(mge.world, mge.zone)) {
                return await this.startInstance(mge);
            } else {
                InstanceHandler.logger.error(`Instance already exists: ${jsonLogOutput(mge)}`);
                return false;
            }
        }

        if (mge.eventState === MetagameEventState.FINISHED) {
            if (this.activeInstanceAuthority.instanceExists(mge.world, mge.zone)) {
                return await this.endInstance(mge);
            } else {
                InstanceHandler.logger.error(`Instance not found: ${jsonLogOutput(mge)}`);
                return false;
            }
        }

        throw new ApplicationException(`MetagameEvent was not stored \r\n${jsonLogOutput(mge)}`);
    }

    private async startInstance(mge: MetagameEventEvent): Promise<boolean> {
        InstanceHandler.logger.info('================== STARTING INSTANCE! ==================');

        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const row = await this.factory.saveDocument({
                instanceId: instanceId(mge),
                censusInstanceId: mge.instanceId,
                world: mge.world,
                zone: mge.zone,
                state: MetagameEventState.STARTED,
                timeStarted: getUnixTimestamp(),
            });
            InstanceHandler.logger.info(`================ INSERTED NEW INSTANCE ${row.instanceId} ================`);
            return await this.activeInstanceAuthority.addInstance(mge);
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to insert instance into DB! ${err}`);
        }
    }

    private async endInstance(mge: MetagameEventEvent): Promise<boolean> {
        InstanceHandler.logger.info(`================== ENDING INSTANCE ${instanceId(mge)} ==================`);

        // Find Instance and update
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const res = await this.factory.model.updateOne(
                {censusInstanceId: instanceId(mge)},
                {
                    state: MetagameEventState.FINISHED,
                    timeEnded: new Date(),
                },
            );

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (!res.nModified) {
                InstanceHandler.logger.error(`No instances were modified on end message! ${instanceId(mge)}`);
                return false;
            }

            await this.activeInstanceAuthority.endInstance(mge);

            InstanceHandler.logger.debug(`================ SUCCESSFULLY ENDED INSTANCE ${instanceId(mge)} ================`);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Unable to finish instance #${instanceId(mge)}! ${err}`);
        }
    }
}
