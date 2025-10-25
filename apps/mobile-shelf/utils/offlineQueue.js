import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'pending_scans';
const MAX_QUEUE_SIZE = 50;

/**
 * Guarda un scan en la cola offline
 * @param {string} imageUri - URI de la imagen comprimida
 * @param {string} shelfId - ID del celular/repisa
 * @returns {Promise<void>}
 */
export async function saveToOfflineQueue(imageUri, shelfId) {
  try {
    const queue = await getOfflineQueue();
    
    // Crear nuevo item
    const newItem = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      imageUri,
      shelfId,
      capturedAt: new Date().toISOString(),
      retryCount: 0,
      lastRetryAt: null,
    };
    
    // Agregar al inicio de la cola
    queue.unshift(newItem);
    
    // Limitar tamaño de cola (FIFO - eliminar más antiguos)
    if (queue.length > MAX_QUEUE_SIZE) {
      const removed = queue.slice(MAX_QUEUE_SIZE);
      console.warn(`⚠️ Cola llena: eliminando ${removed.length} scans antiguos`);
      queue.splice(MAX_QUEUE_SIZE);
    }
    
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log(`✅ Scan guardado en cola offline (total: ${queue.length})`);
    
  } catch (error) {
    console.error('❌ Error guardando en cola offline:', error);
    throw error;
  }
}

/**
 * Obtiene todos los scans pendientes en la cola
 * @returns {Promise<Array>}
 */
export async function getOfflineQueue() {
  try {
    const queueStr = await AsyncStorage.getItem(QUEUE_KEY);
    
    if (!queueStr) {
      return [];
    }
    
    const queue = JSON.parse(queueStr);
    return Array.isArray(queue) ? queue : [];
    
  } catch (error) {
    console.error('❌ Error leyendo cola offline:', error);
    return [];
  }
}

/**
 * Elimina un scan de la cola después de ser procesado exitosamente
 * @param {string} itemId - ID del item a eliminar
 * @returns {Promise<void>}
 */
export async function removeFromOfflineQueue(itemId) {
  try {
    const queue = await getOfflineQueue();
    const filteredQueue = queue.filter(item => item.id !== itemId);
    
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filteredQueue));
    console.log(`✅ Scan eliminado de cola: ${itemId}`);
    
  } catch (error) {
    console.error('❌ Error eliminando de cola:', error);
    throw error;
  }
}

/**
 * Incrementa el contador de reintentos de un item
 * @param {string} itemId - ID del item
 * @returns {Promise<void>}
 */
export async function incrementRetryCount(itemId) {
  try {
    const queue = await getOfflineQueue();
    const item = queue.find(i => i.id === itemId);
    
    if (item) {
      item.retryCount++;
      item.lastRetryAt = new Date().toISOString();
      
      // Si llegó al máximo de reintentos, eliminarlo
      if (item.retryCount >= 3) {
        console.warn(`⚠️ Scan ${itemId} alcanzó máximo de reintentos, eliminando...`);
        await removeFromOfflineQueue(itemId);
      } else {
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      }
    }
    
  } catch (error) {
    console.error('❌ Error incrementando retry count:', error);
  }
}

/**
 * Limpia toda la cola offline
 * @returns {Promise<void>}
 */
export async function clearOfflineQueue() {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
    console.log('✅ Cola offline limpiada');
  } catch (error) {
    console.error('❌ Error limpiando cola:', error);
  }
}

/**
 * Obtiene el tamaño actual de la cola
 * @returns {Promise<number>}
 */
export async function getQueueSize() {
  const queue = await getOfflineQueue();
  return queue.length;
}

