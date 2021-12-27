/* eslint-disable prettier/prettier */
import { Logger } from '@nestjs/common';
import {
  MessageBody,
  ConnectedSocket,
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
  maxHttpBufferSize: 5 * 1024 * 1024
})
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  usrList: Object;
  roomList: Array<string>;
  rooms: Object;
  constructor() {
    this.usrList = {};
    this.roomList = ['채팅방#1', '#1', '#2', '#3', '#4'];
    this.rooms = {
      "#1": [],
      "채팅방#1": [],
      "#2": [],
      "#3": [],
      "#4": []
    };
  }

  @WebSocketServer() server: Server;

  private logger: Logger = new Logger('AppGateway');

  @SubscribeMessage('rooms')
  getRoomList(@MessageBody() data: string) {
    this.server.emit('rooms', this.roomList);
  }
  @SubscribeMessage('join')
  handleJoin(@MessageBody() data: { socketIdx: string, room: string }) {
    this.logger.log(data);
    this.server.socketsJoin(data.room);
    this.usrList[data.socketIdx] = data.room;
    this.rooms[data.room].push(data.socketIdx);
    this.server.to(data.room).emit('joinRoom', data.socketIdx);
  }
  @SubscribeMessage('leave')
  handleLeave(@MessageBody() data: { socketIdx: string, room: string }) {
    this.logger.log(data);
    delete this.usrList[data.socketIdx];
    this.server.socketsLeave(data.room);
    this.rooms[data.room] = this.rooms[data.room].filter((el) => el !== data.socketIdx);
    this.server.to(data.room).emit('leaveRoom', data.socketIdx);
  }
  @SubscribeMessage('headCount')
  getHeadCount(@MessageBody() data: string) {
    this.server.emit('headCount', this.rooms);
  }
  @SubscribeMessage('send')
  handleMessage(@MessageBody() data: { socketIdx: string, message: string, room: string }) {
    this.server.to(data.room).emit('receive', {
      message: data.message,
      idx: data.socketIdx
    });
  }
  @SubscribeMessage('sendImage')
  handleBlob(@MessageBody() data: { socketIdx: string, message: ArrayBuffer, room: string }) {
    this.server.to(data.room).emit('receiveImage', {
      message: data.message,
      idx: data.socketIdx
    });
  }

  afterInit(server: Server) {
    this.logger.log('init');
  }
  handleDisconnect(client: Socket) {
    this.logger.log(`Client Disconnected : ${client.id}`);
    if (this.usrList[client.id]) {
      this.server.to(this.usrList[client.id]).emit('leaveRoom', client.id);
      this.rooms[this.usrList[client.id]] = this.rooms[this.usrList[client.id]].filter((el) => el !== client.id);
      delete this.usrList[client.id];
    }
  }
  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client Connected : ${client.id}`);
    client.emit('room', Array.from(client.rooms));
  }
}
