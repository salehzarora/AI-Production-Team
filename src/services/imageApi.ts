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

export async function generateImageViaBackend(req: GenerateImageRequest): Promise<GenerateImageResponse> {
  const res = await fetch(`${BACKEND_URL}/api/images/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Server error ${res.status}`);
  }

  return res.json() as Promise<GenerateImageResponse>;
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export { BACKEND_URL };
