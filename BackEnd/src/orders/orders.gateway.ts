import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Esto permite que la tablet (puerto 3001) hable con el socket (puerto 3000)
    methods: ['GET', 'POST'],
    allowedHeaders: ['content-type'],
    credentials: true,
  },
})

export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
    client.emit('bienvenida', { mensaje: '¡Bienvenido a Guadalupe Café!' });
  }

  handleDisconnect(client: any) {
    console.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('crear-orden')
  async handleCreateOrder(
    @MessageBody() data:any,
    @ConnectedSocket() client: Socket
  ){
    console.log('Nueva orden recibida de la tablet:', data);

    //Aqui luego llamas al service
    //const nuevOrden = await this.ordersService.create(data);

    this.server.emit('orden-confirmada', {
      id: Math.floor(Math.random() * 1000),
      mensaje: 'Orden registrada en Guadalupe Café'
    });
  }

  // Este método lo llamaremos desde el Service cuando se cree una orden
  emitNewOrder(order: any) {
    this.server.emit('new-order-received', order);
  }
}