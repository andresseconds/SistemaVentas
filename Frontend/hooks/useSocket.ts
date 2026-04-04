import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 1. Detectamos automáticamente la IP de donde viene la página
    const serverIp = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    
    // Se conecta dinámicamente usando esa IP
    const socketInstance = io(`http://${serverIp}:3000`, {
      transports: ['websocket'],
      reconnectionAttempts: 5
    });

    socketInstance.on('bienvenida', (data) => {
      alert(data.mensaje); // Si sale esta alerta en la tablet, ¡ESTÁS CONECTADO!
    });

    socketInstance.on('connect', () => {
      console.log("¡Socket Conectado con éxito!");
      setIsConnected(true);
    });

    socketInstance.on('connect_error', (err) => {
      console.error("Error de socket (revisa Firewall puerto 3000):", err.message);
    });

    socketInstance.on('disconnect', () => {
      console.log("Socket desconectado");
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return { socket, isConnected };
};