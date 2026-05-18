import { useCallback, useState } from 'react';

const STORAGE_KEY = 'aipt.access-key';

export function useAccessKey() {
  const [accessKey, setAccessKeyState] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? '',
  );

  const setAccessKey = useCallback((key: string) => {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setAccessKeyState(trimmed);
  }, []);

  const clearAccessKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAccessKeyState('');
  }, []);

  return { accessKey, setAccessKey, clearAccessKey };
}
