import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Comprime una imagen a JPEG con las especificaciones del proyecto
 * @param {string} imageUri - URI de la imagen original
 * @returns {Promise<Object>} - Objeto con uri, width, height de la imagen comprimida
 */
export async function compressImage(imageUri) {
  try {
    const maxWidth = parseInt(process.env.EXPO_PUBLIC_IMAGE_MAX_WIDTH) || 1280;
    const quality = parseFloat(process.env.EXPO_PUBLIC_IMAGE_QUALITY) || 0.80;

    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: maxWidth } }], // Height se ajusta proporcionalmente
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    console.log(`✅ Imagen comprimida: ${result.width}x${result.height}`);
    
    return result;
  } catch (error) {
    console.error('❌ Error comprimiendo imagen:', error);
    throw new Error('Error al comprimir imagen: ' + error.message);
  }
}

