import Transport from 'winston-transport';
import axios, {AxiosError, AxiosInstance, AxiosProxyConfig} from 'axios';
import {get} from 'lodash';

interface Embed {
    description: string;
    color: number;
    timestamp: string;
    footer: {
        text: string;
    };
}

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/naming-convention, @typescript-eslint/no-unsafe-return */
export default class DiscordTransport extends Transport {
    public static readonly defaultLevelColors = {
        error: 11010049, // Red
        warn: 16763904, // Yellow
        info: 5350479, // Green
        verbose: 52479, // Light Blue
        debug: 100, // Indigo
    };

    private readonly webhookUrl: string;
    private readonly maxEmbeds: number;
    private readonly levelColors: Record<string, number>;
    private readonly username?: string;
    private readonly avatarUrl?: string;

    private readonly axios: AxiosInstance;

    private readonly queue: Set<Set<Embed>> = new Set();
    private working = false;
    private ratelimited = false;

    constructor(opts: DiscordTransportOptions) {
        super(opts);

        this.webhookUrl = opts.webhookUrl;
        this.maxEmbeds = opts.maxEmbeds ?? 10;
        this.levelColors = opts.levelColors ?? DiscordTransport.defaultLevelColors;
        this.username = opts.username;
        this.avatarUrl = opts.avatarUrl;

        this.axios = axios.create({
            proxy: opts.proxy ?? undefined,
        });
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
    public log(info: any, callback: () => void): any {
        this.addQueue({
            description: info.message,
            color: this.levelToColor(info.level),
            timestamp: info.timestamp,
            footer: {
                text: info.label,
            },
        });

        if (!this.working) {
            this.handleQueue();
        }

        callback();
    }

    private handleQueue(): void {
        if (this.ratelimited) {
            return;
        }

        this.working = true;
        const [bucket] = this.queue;

        if (bucket) {
            this.axios.post(this.webhookUrl, {
                username: this.username,
                avatar_url: this.avatarUrl,
                embeds: Array.from(bucket),
            })
                .then(() => {
                    this.queue.delete(bucket);
                    this.handleQueue();
                })
                .catch((err: AxiosError) => {
                    if (err.response?.status === 429) {
                        this.ratelimited = true;
                        setTimeout(() => this.handleQueue(), err.response.headers['x-ratelimit-reset-after'] * 1000);

                        return;
                    }

                    this.queue.delete(bucket);
                    this.handleQueue();

                    this.emit('error', err);
                });
        } else {
            this.working = false;
        }
    }

    private addQueue(embed: Embed): void {
        let bucket = Array.from(this.queue).pop();

        if (!bucket || bucket.size >= this.maxEmbeds) {
            bucket = new Set();
            this.queue.add(bucket);
        }

        bucket.add(embed);
    }

    private levelToColor(level: string): number {
        return get(this.levelColors, level, 7433572);
    }
}

export interface DiscordTransportOptions {
    webhookUrl: string;
    maxEmbeds?: number;
    username?: string;
    avatarUrl?: string;
    level?: string;
    levelColors?: Record<string, number>;
    proxy?: AxiosProxyConfig;
}
