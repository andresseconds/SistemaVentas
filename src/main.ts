import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*', // Permite cualquier origen (PC, Tablet, Celular)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // DEBE quedar así para que acepte conexiones de la red WiFi
  await app.listen(3000, '0.0.0.0');
  console.log(`Backend corriendo en el puerto 3000`);
}
bootstrap();
