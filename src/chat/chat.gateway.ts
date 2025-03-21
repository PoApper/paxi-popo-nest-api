import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

import { JwtPayload } from 'src/auth/strategies/jwt.payload';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    /*private readonly chatService: ChatService*/
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    console.log('client connected');
    try {
      const cookies = client.handshake.headers.cookie;
      const token = cookies
        ?.split('; ')
        ?.find((cookie) => cookie.startsWith('Authentication='))
        ?.split('=')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload: JwtPayload = await this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET_KEY,
      });

      client.data.user = payload;
    } catch (e) {
      console.log('error', e);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log('client disconnected');
    delete client.data.user;
  }
}
