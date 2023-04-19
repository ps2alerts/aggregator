import {PrometheusController} from '@willsoto/nestjs-prometheus';
import {Controller, Get, Res} from '@nestjs/common';
import {Response} from 'express';

@Controller()
export class MetricsController extends PrometheusController {
    @Get()
    public async index(@Res() response: Response) {
        return super.index(response);
    }
}
