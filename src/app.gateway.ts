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

@WebSocketGateway(parseInt(process.env.PORT) || 444, {
  transports: ['websocket'],
  namespace: 'webChat',
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  usrList: Object;
  constructor() { 
    this.usrList = {}
  }

  @WebSocketServer() server: Server;

  private logger: Logger = new Logger('AppGateway');
  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: { socketIdx: string, room: string }) {
    this.server.socketsJoin(data.room);
    this.usrList[data.socketIdx] = data.room;
    this.server.to(data.room).emit('joinRoom', data.socketIdx);
  }
  @SubscribeMessage('send')
  handleSend(@MessageBody() data: { socketIdx: string, message: string, room: string }) {
    this.server.to(data.room).emit('receive', {
      message: data.message,
      idx: data.socketIdx
    });
  }
  @SubscribeMessage('leave')
  handleLeave(@MessageBody() data: { socketIdx: string, room: string }) {
    delete this.usrList[data.socketIdx];
    this.server.socketsLeave(data.room);
    this.server.to(data.room).emit('leaveRoom', data.socketIdx);
  }

  afterInit(server: Server) {
    this.logger.log('init');
  }
  handleDisconnect(client: Socket) {
    this.server.to(this.usrList[client.id]).emit('leaveRoom', client.id);
    delete this.usrList[client.id];
  }
  handleConnection(client: Socket, ...args: any[]) {
    client.emit('room', Array.from(client.rooms));
  }
}
