import Transport from 'winston-transport';
import axios, {AxiosInstance, AxiosProxyConfig} from 'axios';
import {get} from 'lodash';

export default class DiscordTransport extends Transport {
    private readonly webhookUrl: string;
    private readonly username?: string;
    private readonly avatarUrl?: string;

    private readonly axios: AxiosInstance;

    constructor(opts: DiscordTransportOptions) {
        super(opts);

        this.webhookUrl = opts.webhookUrl;
        this.username = opts.username;
        this.avatarUrl = opts.avatarUrl;

        this.axios = axios.create({
            proxy: opts.proxy ?? undefined,
        });
    }

    public log(info: any, callback: () => void): any {
        const payload = {
            username: this.username,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            avatar_url: this.avatarUrl,
            embeds: [{
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
                description: info.message,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                color: this.levelToColor(info.level),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
                timestamp: info.timestamp,
                footer: {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
                    text: info.label,
                },
            }],
        };

        this.axios.post(this.webhookUrl, payload).then(() => {
            this.emit('logged', info);
            callback();
        }).catch((err) => {
            this.emit('error', err);
            callback();
        });
    }

    private levelToColor(level: string): number {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return get({
            error: 15073281, // Red
            warn: 16763904, // Yellow
            info: 3394611, // Green
            verbose: 52479, // Light Blue
            debug: 230, // Indigo
        }, level, 808080);
    }
}

export interface DiscordTransportOptions {
    webhookUrl: string;
    username?: string;
    avatarUrl?: string;
    level?: string;
    proxy?: AxiosProxyConfig;

    formatter?(info: {
        level: string;
        message: string;
        [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    }): any; // eslint-disable-line @typescript-eslint/no-explicit-any
}
