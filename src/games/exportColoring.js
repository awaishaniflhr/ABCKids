import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

export const CANVAS_EXPORT_SIZE = 1200;

// Export the SVG drawing itself: no screen capture, menus, progress text, or palette.
export async function exportColoring(svg, templateId) {
  const gallery = NativeModules.DrawingGallery;
  if (Platform.OS !== 'android' || !gallery?.savePng) {
    throw new Error('Gallery saving is unavailable on this device.');
  }
  if (!svg?.toDataURL) throw new Error('The drawing is not ready yet.');

  // Android 10+ can add our own pictures without reading the photo library.
  if (Number(Platform.Version) <= 28) {
    const permission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    );
    if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
      const error = new Error('Allow saving pictures to save your drawing.');
      error.code = 'E_PERMISSION';
      throw error;
    }
  }

  const png = await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Picture export timed out.')),
      10000,
    );
    try {
      svg.toDataURL(
        base64 => {
          clearTimeout(timeout);
          if (typeof base64 === 'string' && base64.length) resolve(base64);
          else reject(new Error('The picture could not be created.'));
        },
        { width: CANVAS_EXPORT_SIZE, height: CANVAS_EXPORT_SIZE },
      );
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
  return gallery.savePng(png, templateId);
}
