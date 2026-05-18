import dotenv from 'dotenv';

dotenv.config();

export interface GenerateImageOptions {
  prompt: string;
  negativePrompt?: string;
  /** Array of base64 data URLs or public image URLs to use as style/subject references. */
  referenceImages?: string[];
}

export interface GenerateImageResult {
  imageUrl: string;
  provider: string;
  promptUsed: string;
}

/**
 * Provider-agnostic image generation entry point.
 *
 * To connect a real provider:
 *   1. Copy server/.env.example → server/.env
 *   2. Set IMAGE_API_KEY and IMAGE_API_URL for your chosen provider.
 *   3. Replace the TODO block below with your provider's fetch call.
 *
 * Supported providers (add your own):
 *   - Replicate  https://replicate.com/docs/reference/http
 *   - fal.ai     https://fal.ai/docs
 *   - Stability AI / DreamStudio
 *   - OpenAI DALL-E 3
 */
export async function generateImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
  const apiKey = process.env.IMAGE_API_KEY;
  const apiUrl = process.env.IMAGE_API_URL;

  if (!apiKey || !apiUrl) {
    console.warn('[imageGenerationService] No provider configured — returning placeholder image.');
    return buildPlaceholder(options.prompt);
  }

  // ------------------------------------------------------------------
  // TODO: Replace the block below with your provider's API call.
  //
  // Example — Replicate (SDXL / Flux):
  //
  //   const response = await fetch('https://api.replicate.com/v1/predictions', {
  //     method: 'POST',
  //     headers: {
  //       Authorization: `Token ${apiKey}`,
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       version: 'YOUR_MODEL_VERSION_ID',
  //       input: {
  //         prompt: options.prompt,
  //         negative_prompt: options.negativePrompt ?? '',
  //         width: 1024,
  //         height: 1024,
  //       },
  //     }),
  //   });
  //   const prediction = await response.json();
  //   // Replicate returns a polling URL; poll until status === 'succeeded':
  //   const imageUrl = await pollReplicate(prediction.urls.get, apiKey);
  //   return { imageUrl, provider: 'replicate', promptUsed: options.prompt };
  //
  // Example — Stability AI (stable-image/generate/core):
  //
  //   const form = new FormData();
  //   form.append('prompt', options.prompt);
  //   if (options.negativePrompt) form.append('negative_prompt', options.negativePrompt);
  //   form.append('output_format', 'jpeg');
  //   const response = await fetch(apiUrl, {
  //     method: 'POST',
  //     headers: { Authorization: `Bearer ${apiKey}`, Accept: 'image/*' },
  //     body: form,
  //   });
  //   const buffer = await response.arrayBuffer();
  //   const imageUrl = `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;
  //   return { imageUrl, provider: 'stability-ai', promptUsed: options.prompt };
  //
  // Example — fal.ai (fal-ai/flux/schnell):
  //
  //   const response = await fetch(apiUrl, {
  //     method: 'POST',
  //     headers: { Authorization: `Key ${apiKey}`, 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ input: { prompt: options.prompt } }),
  //   });
  //   const data = await response.json();
  //   return { imageUrl: data.images[0].url, provider: 'fal-ai', promptUsed: options.prompt };
  // ------------------------------------------------------------------

  throw new Error(
    'IMAGE_API_KEY and IMAGE_API_URL are set but no provider implementation exists yet. ' +
    'Add your provider\'s fetch call in server/services/imageGenerationService.ts.'
  );
}

// Returns a dark SVG data URL so the full UI flow can be exercised without a real provider.
function buildPlaceholder(prompt: string): GenerateImageResult {
  const label = prompt.length > 60 ? prompt.slice(0, 57) + '…' : prompt;
  const escaped = label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">',
    '<rect width="512" height="512" fill="#0f172a"/>',
    '<rect x="1" y="1" width="510" height="510" fill="none" stroke="#334155" stroke-width="2"/>',
    '<text x="256" y="230" font-family="monospace" font-size="13" fill="#94a3b8" text-anchor="middle">Placeholder — no provider configured</text>',
    `<text x="256" y="260" font-family="monospace" font-size="10" fill="#475569" text-anchor="middle">${escaped}</text>`,
    '<text x="256" y="290" font-family="monospace" font-size="10" fill="#1e3a5f" text-anchor="middle">Set IMAGE_API_KEY + IMAGE_API_URL in server/.env</text>',
    '</svg>',
  ].join('');
  const imageUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return { imageUrl, provider: 'placeholder', promptUsed: prompt };
}
