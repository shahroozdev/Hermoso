interface AnalyzeResult {
  faceValid: boolean;
  faceGuidance: string[];
  summary: string;
  metrics: Array<{
    key: 'hydration' | 'sunDamage' | 'skinClarity' | 'pigmentation' | 'skinBarrier';
    score: number;
    label: string;
  }>;
  recommendations: string[];
}

const DEFAULT_RESULT: AnalyzeResult = {
  faceValid: false,
  faceGuidance: ['Move closer and keep your full face centered with clear lighting.'],
  summary: '',
  metrics: [],
  recommendations: []
};

export const analyzeFaceWithOpenRouter = async (imageBuffer: Buffer, mimeType: string): Promise<AnalyzeResult> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return DEFAULT_RESULT;

  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
  const imageBase64 = imageBuffer.toString('base64');
  const imageDataUrl = `data:${mimeType};base64,${imageBase64}`;

  const prompt = `
You are a strict skincare vision triage assistant.
First task: verify if image is a proper human face image for skin analysis.
If not proper (face covered, blurred, too dark/bright, side angle too extreme, no face, multiple faces), set faceValid=false and provide concise guidance steps.
If proper, set faceValid=true and estimate realistic skincare metrics.

Return strict JSON only with this schema:
{
  "faceValid": boolean,
  "faceGuidance": string[],
  "summary": string,
  "metrics": [
    {"key":"hydration","score":0-100,"label":"..."},
    {"key":"sunDamage","score":0-100,"label":"..."},
    {"key":"skinClarity","score":0-100,"label":"..."},
    {"key":"pigmentation","score":0-100,"label":"..."},
    {"key":"skinBarrier","score":0-100,"label":"..."}
  ],
  "recommendations": string[]
}

Rules:
- scores must be integers 0-100
- always include exactly 5 metrics in the listed key order when faceValid=true
- recommendations should be service-style names suitable for a salon app, e.g. "Hydra Facial", "Vitamin C Glow Treatment", "LED Light Therapy", "Chemical Peel"
- keep guidance short action phrases like "Move face to center", "Turn slightly left", "Improve front lighting", "Remove face covering"
`.trim();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this uploaded face image for validation and skincare insights.' },
            { type: 'image_url', image_url: { url: imageDataUrl } }
          ]
        }
      ]
    })
  });

  if (!response.ok) return DEFAULT_RESULT;

  const json: { choices?: { message?: { content?: string } }[] } = await response.json();
  const raw = json?.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== 'string') return DEFAULT_RESULT;

  try {
    const parsed = JSON.parse(raw) as AnalyzeResult;
    return parsed;
  } catch {
    return DEFAULT_RESULT;
  }
};
