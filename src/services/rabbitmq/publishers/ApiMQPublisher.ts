import RabbitMQ from '../../../config/rabbitmq';
import {inject, injectable} from 'inversify';
import {RabbitMQConnectionHandlerFactory} from '../RabbitMQConnectionHandlerFactory';
import {TYPES} from '../../../constants/types';
import {ChannelWrapper} from 'amqp-connection-manager';
import {getLogger} from '../../../logger';
import {jsonLogOutput} from '../../../utils/json';
import ApiMQMessage from '../../../data/ApiMQMessage';
import ApplicationException from '../../../exceptions/ApplicationException';
import {RabbitMQConnectionAwareInterface} from '../../../interfaces/RabbitMQConnectionAwareInterface';

@injectable()
export default class ApiMQPublisher implements RabbitMQConnectionAwareInterface {
    private static readonly logger = getLogger('ApiMQPublisher');
    private readonly config: RabbitMQ;
    private readonly connectionHandlerFactory: RabbitMQConnectionHandlerFactory;
    private channelWrapper: ChannelWrapper;

    constructor(
    @inject('rabbitMQConfig') config: RabbitMQ,
        @inject(TYPES.rabbitMqConnectionHandlerFactory) connectionHandlerFactory: RabbitMQConnectionHandlerFactory,
    ) {
        this.config = config;
        this.connectionHandlerFactory = connectionHandlerFactory;
    }

    public async connect(): Promise<boolean> {
        ApiMQPublisher.logger.info('Connecting to queue...');
        this.channelWrapper = await this.connectionHandlerFactory.setupConnection(this.config.apiqueuename, null);
        ApiMQPublisher.logger.info('Connected!');

        return true;
    }

    public async send(msg: ApiMQMessage): Promise<boolean> {
        ApiMQPublisher.logger.debug('Sending message to API MQ');
        ApiMQPublisher.logger.debug(jsonLogOutput(msg));

        try {
            await this.channelWrapper.publish(this.config.exchange, 'create', msg);
            return true;
        } catch (e) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            throw new ApplicationException(`Could not publish message to API! E: ${e.message}`);
        }
    }
}
