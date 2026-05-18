import type { Request, Response } from 'express';
import { generateImage as generate } from '../services/imageGenerationService';

export async function generateImage(req: Request, res: Response): Promise<void> {
  const { projectId, assetKind, assetId, prompt, negativePrompt, notes, referenceImages } = req.body as {
    projectId?: string;
    assetKind?: string;
    assetId?: string;
    prompt?: string;
    negativePrompt?: string;
    notes?: string;
    referenceImages?: string[];
  };

  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    res.status(400).json({ success: false, error: '`prompt` is required and must be a non-empty string.' });
    return;
  }

  try {
    const result = await generate({
      prompt: prompt.trim(),
      negativePrompt: negativePrompt?.trim(),
      referenceImages: Array.isArray(referenceImages) ? referenceImages : undefined,
    });

    res.json({
      success: true,
      imageUrl: result.imageUrl,
      provider: result.provider,
      promptUsed: result.promptUsed,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image generation failed.';
    console.error('[imageController] error:', message);
    res.status(500).json({ success: false, error: message });
  }
}
