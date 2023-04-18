import {PrometheusController} from '@willsoto/nestjs-prometheus';
import {Controller, Get, Res} from '@nestjs/common';
import {Response} from 'express';

@Controller()
export class MonitoringController extends PrometheusController {
    @Get()
    public async index(@Res() response: Response) {
        console.log('Metrics hit!');
        return super.index(response);
    }
}
