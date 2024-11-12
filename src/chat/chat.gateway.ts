import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { AppService } from '../app.service';
import { ChatService } from './chat.service';
import { Chat } from 'src/schemas/chat.schema';

@WebSocketGateway(3050, { cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private activeUsers: Map<string, { id: string, isActive: boolean }> = new Map(); // Map to store socket.id to user details

  constructor(
    private jwtService: JwtService,
    private appService: AppService,
    private chatService: ChatService
  ) {}

  private getSocketIdByUserId(userId: string): string | undefined {
    for (const [socketId, user] of this.activeUsers.entries()) {
        if (user.id === userId) {
            return socketId;
        }
    }
    return undefined;
  }

  async handleConnection(@ConnectedSocket() socket: Socket) {
    try {
      const token = socket.handshake.query.token as string;
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // Store the mapping of socket.id to user details
      this.activeUsers.set(socket.id, { id: userId, isActive: true });
      // Update user status to active
      await this.appService.updateUserStatus(userId);

      // Notify other users about the new connection
      this.server.emit('userConnected', { userId });
    } catch (err) {
      socket.disconnect();
    }
  }

  async handleDisconnect(@ConnectedSocket() socket: Socket) {
    const user = this.activeUsers.get(socket.id);

    if (user) {
      // Update user status to inactive
      user.isActive = false;
      await this.appService.updateUserStatus(user.id);

      // Notify other users about the disconnection
      this.server.emit('userDisconnected', { userId: user.id });

      this.server.emit("statusUpdated", user.id, "Idle")

      // Remove the mapping of socket.id to user details
      this.activeUsers.delete(socket.id);
    }
  }

  @SubscribeMessage("updateStatus")
  async updateStatus(@ConnectedSocket() socket: Socket, @MessageBody() { receiverId, status }: { receiverId: string, status: "Typing" | "Idle" }) {
    const user = this.activeUsers.get(socket.id);
    const otherUserId = this.getSocketIdByUserId(receiverId);
    

    if(user && otherUserId) {
      //it will send to otherUser. the first params for fe catch who is updating his status, and second params for the status value
      this.server.to(otherUserId).emit("statusUpdated", user.id, status);
    }
  }

  @SubscribeMessage('upsertMessage')
  async handleMessage(@ConnectedSocket() socket: Socket, @MessageBody() { receiverId, data }: { receiverId: string, data: { type: "send", data: Chat } | { type: "delete", data: string } | { type: "update", data: { id: string, chat: Chat } } }) {
    const user = this.activeUsers.get(socket.id);
    console.log(receiverId)
    const otherUserId = this.getSocketIdByUserId(receiverId);
    console.log(user)
    console.log(otherUserId)
    console.log(data)

    if (user && otherUserId) {
      // Emit the message to the receiver
      this.server.to(otherUserId).emit('messageUpsert', user.id, data);

      //add this because after he send Message it will be change his status to Idle
      this.server.to(otherUserId).emit("statusUpdated", user.id, "Idle");
    }
  }
}