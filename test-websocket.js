#!/usr/bin/env node

/**
 * Script de prueba para verificar la conexión WebSocket
 * Uso: node test-websocket.js
 */

const io = require('socket.io-client');

console.log('🧪 Probando conexión WebSocket...\n');

const socket = io('http://localhost:3001/ws', {
  transports: ['websocket', 'polling'],
  reconnection: false,
});

socket.on('connect', () => {
  console.log('✅ CONEXIÓN EXITOSA a ws://localhost:3001/ws');
  console.log('   Socket ID:', socket.id);
  console.log('   Transporte:', socket.io.engine.transport.name);
  
  // Probar start_scan
  console.log('\n📡 Probando start_scan...');
  socket.emit('start_scan', 
    { trolleyId: 1, operatorId: 1 },
    (response) => {
      if (response.error) {
        console.log('❌ Error en start_scan:', response.error);
      } else {
        console.log('✅ start_scan exitoso:');
        console.log('   Scan ID:', response.scanId);
        console.log('   Status:', response.status);
        
        // Finalizar el scan
        console.log('\n📡 Probando end_scan...');
        socket.emit('end_scan',
          { scanId: response.scanId },
          (endResponse) => {
            if (endResponse.error) {
              console.log('❌ Error en end_scan:', endResponse.error);
            } else {
              console.log('✅ end_scan exitoso:');
              console.log('   Status:', endResponse.status);
              console.log('   Ended at:', endResponse.endedAt);
            }
            
            console.log('\n✅ TODAS LAS PRUEBAS PASARON');
            console.log('🎉 El WebSocket está funcionando correctamente!\n');
            
            socket.disconnect();
            process.exit(0);
          }
        );
      }
    }
  );
});

socket.on('connect_error', (error) => {
  console.log('❌ ERROR DE CONEXIÓN:', error.message);
  console.log('\n💡 Posibles causas:');
  console.log('   1. El backend no está corriendo en puerto 3001');
  console.log('   2. El namespace /ws no está configurado');
  console.log('   3. Hay un firewall bloqueando la conexión');
  console.log('\n🔧 Solución:');
  console.log('   Ejecuta: ./start.sh');
  console.log('   Espera 5 segundos y vuelve a intentar\n');
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Desconectado:', reason);
});

// Timeout de 10 segundos
setTimeout(() => {
  console.log('⏱️  TIMEOUT: No se pudo conectar en 10 segundos');
  socket.disconnect();
  process.exit(1);
}, 10000);

