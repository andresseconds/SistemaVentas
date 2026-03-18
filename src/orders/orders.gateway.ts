import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect 
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ 
  cors: { origin: '*' } // Esto permite que la Tablet (otra IP) se conecte al PC
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    console.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: any) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  // Este método lo llamaremos desde el Service cuando se cree una orden
  emitNewOrder(order: any) {
    this.server.emit('new-order-received', order);
  }
}