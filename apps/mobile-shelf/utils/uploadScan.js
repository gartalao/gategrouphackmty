/**
 * Envía una imagen escaneada al backend
 * @param {string} imageUri - URI de la imagen comprimida
 * @param {string} shelfId - ID del celular/repisa (1, 2, o 3)
 * @returns {Promise<Object>} - Respuesta del servidor con scan_id
 */
export async function uploadScan(imageUri, shelfId) {
  try {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    const flightId = process.env.EXPO_PUBLIC_FLIGHT_ID || '123';
    const trolleyId = process.env.EXPO_PUBLIC_TROLLEY_ID || '456';

    if (!apiUrl) {
      throw new Error('EXPO_PUBLIC_API_URL no está configurada en .env');
    }

    // Crear FormData con la imagen y metadata
    const formData = new FormData();
    
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: `scan_${Date.now()}.jpg`,
    });
    
    formData.append('flight_id', flightId);
    formData.append('trolley_id', trolleyId);
    formData.append('shelf_id', shelfId);
    formData.append('captured_by', `phone_${shelfId}`);

    console.log(`☁️ Enviando a: ${apiUrl}/scan`);
    console.log(`📦 Metadata: flight=${flightId}, trolley=${trolleyId}, shelf=${shelfId}`);

    // Enviar request al backend
    const response = await fetch(`${apiUrl}/scan`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Timeout de 10 segundos
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Respuesta del servidor:', result);
    
    return result;

  } catch (error) {
    console.error('❌ Error en upload:', error);
    
    // Distinguir tipos de error
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new Error('Timeout: El servidor no respondió');
    } else if (error.message.includes('Network request failed')) {
      throw new Error('Sin conexión al backend');
    } else {
      throw error;
    }
  }
}

