import {ConsumeMessage} from 'amqplib';

export const getEventTypeFromMessage = (message: ConsumeMessage): string => {
    return message.fields.routingKey.split('.')[1];
};
