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

@WebSocketGateway(7778, {
  transports: ['websocket'],
  namespace: 'webChat',
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  @WebSocketServer() server: Server;

  private logger: Logger = new Logger('AppGateway');
  @SubscribeMessage('init')
  handleEvent(@MessageBody() data: string) {
    this.logger.log(data);
  }
  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: string) {
    this.logger.log(data);
    this.server.socketsJoin(data);
  }
  @SubscribeMessage('send')
  handleSend(@MessageBody() data: string) {
    this.logger.log(data);
    this.server.emit('receive', {
      message : data,
      idx: 0,
      room: "#1",
    });
  }

  afterInit(server: Server) {
    this.logger.log('init');
  }
  handleDisconnect(client: Socket) {
    this.logger.log(`Client Disconnected : ${client.id}`);
  }
  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client Connected : ${client.id}`);
    client.join('#1');
    client.emit('room', Array.from(client.rooms));
  }
}
