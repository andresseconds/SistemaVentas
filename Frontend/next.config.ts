/** @type {import('next').NextConfig} */
const nextConfig = {
  // Esto le dice a Next.js que confíe en las peticiones que vienen de tu propia IP
  allowedDevOrigins: ['172.20.10.5','192.168.1.100:3001', 'localhost:3001'],
  
  // Opcional: Si usas Turbopack, esto ayuda con los WebSockets de desarrollo
  devIndicators: {
    appIsrStatus: false,
  },
};

module.exports = nextConfig;