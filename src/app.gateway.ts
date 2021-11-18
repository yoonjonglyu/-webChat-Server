/* eslint-disable prettier/prettier */
import { Logger } from '@nestjs/common';
import {
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(80, {
    transports: ['websocket'],
    namespace: 'webChat',
})
export class AppGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() { }
    @WebSocketServer() server: Server;

    private logger: Logger = new Logger('AppGateway');
    @SubscribeMessage('events')
    handleEvent(@MessageBody() data: string): string {
        return data;
    }
    afterInit(server: Server) {
        this.logger.log('init');
    }
    handleDisconnect(client: Socket) {
        this.logger.log(`Client Disconnected : ${client.id}`);
    }

    handleConnection(client: Socket, ...args: any[]) {
        this.logger.log(`Client Connected : ${client.id}`);
    }
}
