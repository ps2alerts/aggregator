/* eslint-disable @typescript-eslint/no-explicit-any */
import {AxiosResponse} from 'axios';

export interface ExternalRequestDriverInterface {
    get(url: string, data?: any): Promise<AxiosResponse<any, any>>;
    post(url: string, data: any): Promise<AxiosResponse<any, any>>;
    put(url: string, data: any): Promise<AxiosResponse<any, any>>;
    patch(url: string, data: any): Promise<AxiosResponse<any, any>>;
    delete(url: string, data?: any): Promise<AxiosResponse<any, any>>;
}

export interface ExternalRequestWrapperInterface {
    request: Promise<AxiosResponse>;
    timer: CallableFunction;
    url: string;
}
