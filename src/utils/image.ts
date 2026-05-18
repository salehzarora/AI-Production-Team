/**
 * Read a user-uploaded image file and return it as a data URL.
 * NOTE: localStorage is shared across all projects and has a ~5 MB hard limit
 * per origin. Uploading many large images will cause `setItem` to throw. We
 * surface a warning to the caller via the rejection. Future work: move binary
 * data to IndexedDB.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') resolve(result);
      else reject(new Error('Unable to read file.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('File read error.'));
    reader.readAsDataURL(file);
  });
}

/** Rough estimate of localStorage usage to warn user. */
export function approxStorageBytes(): number {
  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const value = localStorage.getItem(key) ?? '';
      total += key.length + value.length;
    }
    return total * 2; // UTF-16
  } catch {
    return 0;
  }
}
