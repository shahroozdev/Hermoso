/**
 * OpenRouter AI Skin Analysis Service
 *
 * Comprehensive face analysis using vision LLMs (GPT-4o or Claude Sonnet 4)
 * with South Asian skin calibration
 *
 * CR-27: AI skin analysis via OpenRouter
 * CR-05: South Asian calibration flag
 */

interface ComprehensiveAnalysisResult {
  faceValid: boolean;
  faceGuidance: string[];
  overallSkinScore: number;
  summary: string;
  error?: string;

  // Detailed analysis sections
  skinTone: {
    tone: string;
    evenness: number;
    tanningPattern: string;
    severity: number;
    recommendedTreatments: string[];
  };

  hydration: {
    hydrationPercent: number;
    dehydrationZones: string[];
    textureRating: number;
    poreCondition: string;
    recommendedTreatments: string[];
  };

  darkCircles: {
    type: 1 | 2 | 3;
    severity: 'mild' | 'moderate' | 'severe';
    colorDelta: number;
    recommendedTreatments: string[];
  };

  acne: {
    zones: Array<{
      area: 'forehead' | 'nose' | 'chin' | 'left-cheek' | 'right-cheek' | 'jawline';
      severity: number;
      type: 'active' | 'healing' | 'hormonal' | 'none';
    }>;
    overallSeverity: number;
    recommendedTreatments: string[];
  };

  lipPigmentation: {
    melaninIndex: number;
    darknessLevel: 'light' | 'medium' | 'dark' | 'very-dark';
    unevenness: number;
    drynessLevel: number;
    recommendedTreatments: string[];
  };

  treatmentPlan: Array<{
    priority: 1 | 2 | 3;
    treatmentName: string;
    reason: string;
    pkrPriceRange: string;
    estimatedDuration: string;
  }>;

  // Legacy fields for backward compatibility
  recommendations: string[];
}

export interface EyebrowLandmarks {
  archShape: 'flat' | 'natural' | 'over-arched' | 'uneven';
  fullness: number;
  leftRightSymmetry: number;
  tailLength: 'short' | 'medium' | 'long';
  sparseness: number;
}

const DEFAULT_RESULT: ComprehensiveAnalysisResult = {
  faceValid: false,
  faceGuidance: ['Move closer and keep your full face centered with clear front lighting.'],
  overallSkinScore: 0,
  summary: '',
  skinTone: {
    tone: 'unknown',
    evenness: 0,
    tanningPattern: '',
    severity: 0,
    recommendedTreatments: []
  },
  hydration: {
    hydrationPercent: 0,
    dehydrationZones: [],
    textureRating: 0,
    poreCondition: '',
    recommendedTreatments: []
  },
  darkCircles: {
    type: 1,
    severity: 'mild',
    colorDelta: 0,
    recommendedTreatments: []
  },
  acne: {
    zones: [],
    overallSeverity: 0,
    recommendedTreatments: []
  },
  lipPigmentation: {
    melaninIndex: 0,
    darknessLevel: 'light',
    unevenness: 0,
    drynessLevel: 0,
    recommendedTreatments: []
  },
  treatmentPlan: [],
  recommendations: []
};

/**
 * South Asian Skin Calibration Context
 * This prompt engineering includes reference skin tones and condition descriptions
 * specifically calibrated for South Asian skin types (CR-05)
 */
const SOUTH_ASIAN_CALIBRATION_CONTEXT = `
IMPORTANT CALIBRATION FOR SOUTH ASIAN SKIN TYPES:

Target Audience: Primarily female customers in Lahore, Karachi, and Islamabad with South Asian skin.

Skin Tone Reference Scale (South Asian context):
- light-cool: Fair with pink undertones (Type II-III)
- light-warm: Fair with golden undertones (Type II-III)
- light-neutral: Fair balanced undertones (Type II-III)
- medium-cool: Wheatish with pink undertones (Type III-IV)
- medium-warm: Wheatish with golden/olive undertones (Type III-IV) [MOST COMMON]
- medium-neutral: Wheatish balanced undertones (Type III-IV)
- medium-dark: Dusky with warm undertones (Type IV-V) [COMMON]
- dark-warm: Deep brown with warm undertones (Type V-VI)
- dark-neutral: Deep brown balanced undertones (Type V-VI)

Common South Asian Skin Concerns:
1. Uneven skin tone and hyperpigmentation (very common due to sun exposure)
2. Tanning on forehead, cheeks, nose bridge (common in medium-warm tones)
3. Dark circles under eyes (genetic predisposition, often Type 1 or 3)
4. Melasma and post-inflammatory hyperpigmentation
5. Oily T-zone with enlarged pores (especially in humid climate)
6. Lip pigmentation and darkness (common concern)

Treatment Preferences (Pakistani Salon Context):
- Tan Correction Facial, Brightening Facial, Vitamin C treatments
- Gold Facial, Pearl Facial (popular in Pakistani market)
- Threading & Brow Shaping (eyebrow maintenance is standard)
- Hydra Facial, Deep Cleansing
- Under-Eye Treatment, Dark Circle Reduction
- Lip Lightening Treatment

Price Range Context (PKR):
- Basic treatments: 1500-3000 PKR
- Advanced facials: 3000-6000 PKR
- Specialized treatments: 5000-12000 PKR
`.trim();

/**
 * Comprehensive AI Analysis Prompt
 * Includes all new analysis categories from the change request
 */
const buildComprehensivePrompt = (eyebrowData?: EyebrowLandmarks): string => {
  const eyebrowContext = eyebrowData
    ? `
EYEBROW DATA (from on-device MediaPipe analysis):
- Arch Shape: ${eyebrowData.archShape}
- Fullness: ${eyebrowData.fullness}/5
- Symmetry: ${eyebrowData.leftRightSymmetry}%
- Tail Length: ${eyebrowData.tailLength}
- Sparseness: ${eyebrowData.sparseness}%

Use this data to inform your recommendations but DO NOT return it in the eyebrow section.
`
    : '';

  return `
${SOUTH_ASIAN_CALIBRATION_CONTEXT}

${eyebrowContext}

You are an expert dermatologist and skincare analyst specializing in South Asian skin types.
Your task: Perform a HOLISTIC, INTELLIGENT face analysis — not just generic metrics.

FIRST: Verify if the image is suitable for skin analysis.
- If not suitable (face covered, blurred, too dark/bright, extreme angle, no face, multiple faces):
  Set faceValid=false and provide concise guidance steps.
- If suitable: Set faceValid=true and proceed with comprehensive analysis.

ANALYSIS REQUIREMENTS:

1. SKIN TONE & TANNING:
   - Identify specific skin tone using the South Asian reference scale above
   - Assess evenness (0-100, where 100 = perfectly even)
   - Describe tanning pattern (be specific: "uneven distribution on forehead and upper cheeks")
   - Rate tanning severity (0-100)
   - Recommend 2-4 treatments from the Pakistani salon context above

2. HYDRATION & TEXTURE:
   - Estimate hydration percentage (0-100)
   - Identify dehydration zones (e.g., ["T-zone", "cheeks", "under-eyes"])
   - Rate texture (0-100, where 100 = smooth)
   - Describe pore condition (e.g., "enlarged pores in T-zone, fine elsewhere")
   - Recommend 2-3 hydration treatments

3. DARK CIRCLES & UNDER-EYE:
   - Classify type:
     * Type 1 = pigmentation (brownish discoloration)
     * Type 2 = vascular (bluish/purplish from visible vessels)
     * Type 3 = structural (shadows from hollows/sunken eyes)
   - Severity: "mild", "moderate", or "severe"
   - Estimate colorDelta (0-100, periorbital color difference)
   - Recommend 2-3 treatments based on type

4. ACNE & BREAKOUT ZONES:
   - Map zones: forehead, nose, chin, left-cheek, right-cheek, jawline
   - For each zone: severity (0-100) and type (active/healing/hormonal/none)
   - Calculate overall severity (0-100)
   - Recommend 2-3 acne treatments if needed

5. LIP PIGMENTATION:
   - Estimate melanin index (0-100)
   - Classify darkness: "light", "medium", "dark", or "very-dark"
   - Rate unevenness (0-100)
   - Rate dryness (0-100)
   - Recommend 1-2 lip treatments if pigmentation is medium or higher

6. TREATMENT PRIORITY PLAN (3 steps, most → least important):
   - Priority 1: Most urgent concern
   - Priority 2: Secondary concern
   - Priority 3: Maintenance/enhancement
   - Each must have: treatmentName, reason (linked to findings), pkrPriceRange, estimatedDuration

7. OVERALL SKIN SCORE:
   - Weighted average of all factors (0-100)
   - Higher score = healthier skin

8. SUMMARY:
   - 2-3 sentences describing the customer's skin holistically
   - Must feel like a dermatologist's assessment, not a filter result

STRICT JSON OUTPUT SCHEMA:
{
  "faceValid": boolean,
  "faceGuidance": string[],
  "overallSkinScore": number,
  "summary": string,
  "skinTone": {
    "tone": string,
    "evenness": number,
    "tanningPattern": string,
    "severity": number,
    "recommendedTreatments": string[]
  },
  "hydration": {
    "hydrationPercent": number,
    "dehydrationZones": string[],
    "textureRating": number,
    "poreCondition": string,
    "recommendedTreatments": string[]
  },
  "darkCircles": {
    "type": 1 | 2 | 3,
    "severity": "mild" | "moderate" | "severe",
    "colorDelta": number,
    "recommendedTreatments": string[]
  },
  "acne": {
    "zones": [
      {
        "area": "forehead" | "nose" | "chin" | "left-cheek" | "right-cheek" | "jawline",
        "severity": number,
        "type": "active" | "healing" | "hormonal" | "none"
      }
    ],
    "overallSeverity": number,
    "recommendedTreatments": string[]
  },
  "lipPigmentation": {
    "melaninIndex": number,
    "darknessLevel": "light" | "medium" | "dark" | "very-dark",
    "unevenness": number,
    "drynessLevel": number,
    "recommendedTreatments": string[]
  },
  "treatmentPlan": [
    {
      "priority": 1 | 2 | 3,
      "treatmentName": string,
      "reason": string,
      "pkrPriceRange": string,
      "estimatedDuration": string
    }
  ],
  "recommendations": string[]
}

RULES:
- All scores must be integers 0-100
- Treatment names must be salon-appropriate (from the list above or similar)
- Be specific and actionable, not generic
- Treatment plan must have exactly 3 items (priority 1, 2, 3)
- Price ranges in PKR format: "2000-4000", "3000-6000", etc.
- Duration format: "30-45 minutes", "60 minutes", etc.
- Recommendations array should list all unique treatment names mentioned
- Use South Asian skin tone scale for tone classification
- Be realistic and helpful — this is a real dermatology assessment
`.trim();
};

async function callOpenRouterWithKey(
  apiKey: string,
  model: string,
  imageDataUrl: string,
  prompt: string
): Promise<{ result: ComprehensiveAnalysisResult | null; status: number | null }> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'https://hermoso.app',
      'X-Title': 'Hermoso AI Skin Analysis'
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this face image comprehensively. Return ONLY valid JSON matching the exact schema. Keep treatment lists to max 3 items each.'
            },
            { type: 'image_url', image_url: { url: imageDataUrl } }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenRouter API error:', response.status, errorText);
    return { result: null, status: response.status };
  }

  const json: { choices?: { message?: { content?: string } }[] } = await response.json();
  const raw = json?.choices?.[0]?.message?.content;

  if (!raw || typeof raw !== 'string') {
    console.error('Invalid response from OpenRouter');
    console.error('Full response:', JSON.stringify(json, null, 2));
    return { result: null, status: null };
  }

  console.log('OpenRouter raw response (first 500 chars):', raw.substring(0, 500));

  let cleanedResponse = raw.trim();
  cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*/i, '');
  cleanedResponse = cleanedResponse.replace(/\s*```$/i, '');
  cleanedResponse = cleanedResponse.trim();

  let parsed: ComprehensiveAnalysisResult;
  try {
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]) as ComprehensiveAnalysisResult;
    } else {
      parsed = JSON.parse(cleanedResponse) as ComprehensiveAnalysisResult;
    }
  } catch (parseError) {
    console.error('Failed to parse OpenRouter response:', parseError);
    console.error('Raw response:', raw.substring(0, 200));
    console.error('Cleaned response:', cleanedResponse.substring(0, 200));
    return { result: null, status: null };
  }

  if (typeof parsed.faceValid !== 'boolean') {
    console.error('Invalid faceValid in response');
    return { result: null, status: null };
  }

  return { result: parsed, status: null };
}

/**
 * Analyze face image with comprehensive South Asian-calibrated AI analysis
 *
 * @param imageUrl - Publicly reachable URL of the face image (e.g. a Cloudinary secure_url)
 * @param eyebrowData - Optional eyebrow landmarks from MediaPipe (mobile side)
 * @returns Comprehensive analysis result
 */
export const analyzeFaceComprehensive = async (
  imageUrl: string,
  eyebrowData?: EyebrowLandmarks
): Promise<ComprehensiveAnalysisResult> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY not configured');
    return DEFAULT_RESULT;
  }

  const fallbackApiKey = process.env.OPENROUTER_API_KEY_FALLBACK;
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o';

  const prompt = buildComprehensivePrompt(eyebrowData);

  try {
    const { result, status } = await callOpenRouterWithKey(apiKey, model, imageUrl, prompt);
    if (result) return result;

    if (status === 429 && fallbackApiKey) {
      console.warn('Primary OpenRouter key rate limited, trying fallback key');
      const fallback = await callOpenRouterWithKey(fallbackApiKey, model, imageUrl, prompt);
      if (fallback.result) return fallback.result;

      if (fallback.status === 429) {
        return {
          ...DEFAULT_RESULT,
          error: 'Service temporarily unavailable due to high demand. Please try again in a few minutes.'
        };
      }
    }

    return DEFAULT_RESULT;
  } catch (error) {
    console.error('Error analyzing face with OpenRouter:', error);
    return DEFAULT_RESULT;
  }
};

let cachedAvailability: { available: boolean; checkedAt: number } | null = null;
const AVAILABILITY_CACHE_MS = 60_000;

/**
 * Lightweight OpenRouter reachability check for the mobile "AI online/offline" indicator.
 * Hits the free /models endpoint (no tokens consumed) and caches the result briefly
 * so the status screen doesn't hammer OpenRouter on every app open.
 */
export const checkOpenRouterAvailability = async (): Promise<boolean> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return false;

  if (cachedAvailability && Date.now() - cachedAvailability.checkedAt < AVAILABILITY_CACHE_MS) {
    return cachedAvailability.available;
  }

  let available: boolean;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal
    });
    clearTimeout(timeout);
    available = response.ok;
  } catch {
    available = false;
  }

  cachedAvailability = { available, checkedAt: Date.now() };
  return available;
};
