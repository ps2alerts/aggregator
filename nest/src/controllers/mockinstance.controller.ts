import {Controller} from '@nestjs/common';
import {MessagePattern} from '@nestjs/microservices';

@Controller()
export class MockInstanceController {
    @MessagePattern({action: 'mock'})
    mock(data: any): any {
        // Start mocking the instance by telling it to the appropriate service

        return {message: 'Just to let you know, I am doing it'};
    }
}
