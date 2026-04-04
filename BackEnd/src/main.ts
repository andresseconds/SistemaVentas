import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS Dinámico: Acepta cualquier origen automáticamente
  app.enableCors({
    origin: true, // Al poner "origin: true", NestJS acepta dinámicamente la IP de quien le hable
    credentials: true,
  });

  // Escucha en todas las interfaces de la red
  await app.listen(3000, '0.0.0.0');
  console.log(`Backend corriendo en el puerto 3000`);
}
bootstrap();
