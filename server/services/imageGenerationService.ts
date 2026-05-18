import OpenAI from 'openai';

export interface GenerateImageOptions {
  prompt: string;
  negativePrompt?: string;
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
 * Reads IMAGE_PROVIDER from env (loaded by index.ts before this is called).
 *
 * Supported IMAGE_PROVIDER values:
 *   openai      — Uses the official openai SDK. Requires IMAGE_API_KEY.
 *                 Uses IMAGE_MODEL (default: gpt-image-1).
 *                 IMAGE_API_URL is NOT required and NOT used.
 *   placeholder — Returns a dark SVG. No API key needed.
 *   (empty)     — Same as placeholder.
 */
export async function generateImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
  const provider = (process.env.IMAGE_PROVIDER ?? '').toLowerCase().trim();

  if (!provider || provider === 'placeholder') {
    return buildPlaceholder(options.prompt);
  }

  if (provider === 'openai') {
    return callOpenAI(options);
  }

  // TODO: add more providers here, e.g.:
  //   if (provider === 'replicate') return callReplicate(options);
  //   if (provider === 'stability') return callStability(options);

  throw new Error(
    `Unknown IMAGE_PROVIDER="${provider}". ` +
    'Supported: openai, placeholder. Check server/.env and restart.',
  );
}

// ---------------------------------------------------------------------------
// OpenAI (gpt-image-1 / dall-e-3)
// ---------------------------------------------------------------------------

async function callOpenAI(options: GenerateImageOptions): Promise<GenerateImageResult> {
  const apiKey = process.env.IMAGE_API_KEY;
  if (!apiKey) {
    throw new Error('IMAGE_PROVIDER=openai but IMAGE_API_KEY is not set in server/.env.');
  }

  const model = (process.env.IMAGE_MODEL ?? 'gpt-image-1').trim();

  const client = new OpenAI({ apiKey });

  const response = await client.images.generate({
    model,
    prompt: options.prompt,
    size: '1024x1024',
    quality: 'auto',
    n: 1,
  });

  const item = response.data?.[0];

  if (!item) {
    throw new Error('OpenAI returned an empty response (no image data).');
  }

  if (item.b64_json) {
    return {
      imageUrl: `data:image/png;base64,${item.b64_json}`,
      provider: 'openai',
      promptUsed: item.revised_prompt ?? options.prompt,
    };
  }

  if (item.url) {
    return {
      imageUrl: item.url,
      provider: 'openai',
      promptUsed: item.revised_prompt ?? options.prompt,
    };
  }

  throw new Error('OpenAI did not return an image (no b64_json or url in response).');
}

// ---------------------------------------------------------------------------
// Placeholder — dark SVG for local UI testing without a real provider
// ---------------------------------------------------------------------------

function buildPlaceholder(prompt: string): GenerateImageResult {
  const label = prompt.length > 60 ? prompt.slice(0, 57) + '…' : prompt;
  const escaped = label
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">',
    '<rect width="512" height="512" fill="#0f172a"/>',
    '<rect x="1" y="1" width="510" height="510" fill="none" stroke="#334155" stroke-width="2"/>',
    '<text x="256" y="230" font-family="monospace" font-size="13" fill="#94a3b8" text-anchor="middle">Placeholder — IMAGE_PROVIDER not set</text>',
    `<text x="256" y="260" font-family="monospace" font-size="10" fill="#475569" text-anchor="middle">${escaped}</text>`,
    '<text x="256" y="290" font-family="monospace" font-size="10" fill="#1e3a5f" text-anchor="middle">Set IMAGE_PROVIDER=openai in server/.env</text>',
    '</svg>',
  ].join('');
  const imageUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return { imageUrl, provider: 'placeholder', promptUsed: prompt };
}
