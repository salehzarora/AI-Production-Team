const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? 'http://localhost:3001';

export type AssetKindParam = 'character' | 'environment' | 'prop' | 'shotImage';

export interface GenerateImageRequest {
  projectId: string;
  assetKind: AssetKindParam;
  assetId: string;
  prompt: string;
  negativePrompt?: string;
  notes?: string;
  referenceImages?: string[];
}

export interface GenerateImageResponse {
  success: true;
  imageUrl: string;
  provider: string;
  promptUsed: string;
}

export interface BackendInfo {
  online: boolean;
  requiresAccessKey: boolean;
}

export async function getBackendInfo(): Promise<BackendInfo> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { online: false, requiresAccessKey: false };
    const data = (await res.json()) as { requiresAccessKey?: boolean };
    return { online: true, requiresAccessKey: Boolean(data.requiresAccessKey) };
  } catch {
    return { online: false, requiresAccessKey: false };
  }
}

export async function generateImageViaBackend(
  req: GenerateImageRequest,
  accessKey?: string,
): Promise<GenerateImageResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessKey) headers['x-app-access-key'] = accessKey;

  const res = await fetch(`${BACKEND_URL}/api/images/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Server error ${res.status}`);
  }

  return res.json() as Promise<GenerateImageResponse>;
}

export { BACKEND_URL };
