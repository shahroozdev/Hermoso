/**
 * Diet Plan Generation Service
 *
 * Rule-based diet plan generator tied to skin tone and conditions
 * CR-31: Diet plan generation
 */

interface DietPlanInput {
  skinTone: string; // e.g., "medium-warm", "dark-neutral"
  conditions: string[]; // e.g., ["dehydration", "pigmentation", "acne"]
}

interface DietRecommendation {
  foodsToEat: Array<{
    food: string;
    reason: string;
  }>;
  foodsToAvoid: Array<{
    food: string;
    reason: string;
  }>;
  dailyWaterIntake: string;
  specificToSkinTone: boolean;
}

/**
 * Diet recommendations database organized by skin conditions and tone
 */
const DIET_DATABASE = {
  // Foods beneficial for specific skin conditions
  conditions: {
    dehydration: {
      eat: [
        { food: 'Cucumber', reason: 'High water content helps hydrate skin from within' },
        { food: 'Watermelon', reason: 'Rich in water and vitamins for skin hydration' },
        { food: 'Coconut water', reason: 'Natural electrolytes support skin moisture balance' },
        { food: 'Oranges', reason: 'Vitamin C and water content boost skin hydration' }
      ],
      avoid: [
        { food: 'Excessive caffeine', reason: 'Dehydrates skin and can worsen dryness' },
        { food: 'Alcohol', reason: 'Dehydrates skin and impairs moisture retention' },
        { food: 'High-sodium foods', reason: 'Salt draws water from skin cells' }
      ]
    },
    pigmentation: {
      eat: [
        { food: 'Tomatoes', reason: 'Lycopene protects against sun damage and reduces pigmentation' },
        { food: 'Papaya', reason: 'Vitamin A and enzymes help lighten dark spots' },
        { food: 'Almonds', reason: 'Vitamin E reduces pigmentation and protects skin' },
        { food: 'Green tea', reason: 'Antioxidants reduce melanin production and dark spots' },
        { food: 'Turmeric (haldi)', reason: 'Curcumin brightens skin tone naturally' }
      ],
      avoid: [
        { food: 'Excessive sugar', reason: 'Causes inflammation leading to dark spots' },
        { food: 'Processed foods', reason: 'Can trigger inflammation and worsen pigmentation' }
      ]
    },
    tanning: {
      eat: [
        { food: 'Carrots', reason: 'Beta-carotene protects against UV damage' },
        { food: 'Yogurt', reason: 'Lactic acid helps lighten tanned skin' },
        { food: 'Lemon water', reason: 'Vitamin C brightens and evens skin tone' },
        { food: 'Strawberries', reason: 'Ellagic acid protects against UV rays' }
      ],
      avoid: [
        { food: 'Excessive citrus before sun', reason: 'Can cause photosensitivity' }
      ]
    },
    acne: {
      eat: [
        { food: 'Fatty fish (salmon)', reason: 'Omega-3 reduces inflammation and acne' },
        { food: 'Zinc-rich foods (pumpkin seeds)', reason: 'Zinc regulates oil production' },
        { food: 'Probiotics (yogurt)', reason: 'Gut health reduces acne breakouts' },
        { food: 'Green leafy vegetables', reason: 'Antioxidants reduce acne inflammation' }
      ],
      avoid: [
        { food: 'Dairy products', reason: 'Can trigger hormonal acne in some people' },
        { food: 'Refined carbs (white bread)', reason: 'Spikes insulin, increases oil production' },
        { food: 'Fried and oily foods', reason: 'Excess oil can worsen acne' },
        { food: 'High-glycemic foods', reason: 'Trigger inflammation and breakouts' }
      ]
    },
    darkCircles: {
      eat: [
        { food: 'Spinach', reason: 'Iron and vitamin K reduce dark circles' },
        { food: 'Beetroot', reason: 'Improves blood circulation, reduces under-eye darkness' },
        { food: 'Walnuts', reason: 'Omega-3 and vitamin E brighten under-eye area' },
        { food: 'Sweet potatoes', reason: 'Vitamin A reduces under-eye pigmentation' }
      ],
      avoid: [
        { food: 'Excessive salt', reason: 'Causes water retention and puffy dark circles' },
        { food: 'Alcohol', reason: 'Dilates blood vessels, worsens dark circles' }
      ]
    },
    lipPigmentation: {
      eat: [
        { food: 'Pomegranate', reason: 'Antioxidants lighten lip pigmentation' },
        { food: 'Beetroot', reason: 'Natural coloring balances lip tone' },
        { food: 'Vitamin E supplements', reason: 'Reduces lip darkness and dryness' }
      ],
      avoid: [
        { food: 'Excessive caffeine', reason: 'Can darken lips over time' },
        { food: 'Tobacco products', reason: 'Major cause of lip darkening' }
      ]
    }
  },

  // Water intake recommendations based on skin tone and climate (South Asian context)
  waterIntake: {
    light: '8-10 glasses (2-2.5 liters) daily',
    medium: '10-12 glasses (2.5-3 liters) daily',
    dark: '10-12 glasses (2.5-3 liters) daily'
  },

  // General foods beneficial for all South Asian skin types
  general: {
    eat: [
      { food: 'Dates (khajoor)', reason: 'Iron-rich, promotes glowing skin' },
      { food: 'Saffron (kesar)', reason: 'Traditionally used for skin brightening' },
      { food: 'Rose water', reason: 'Hydrates and soothes skin naturally' },
      { food: 'Fresh fruits', reason: 'Vitamins and antioxidants for healthy skin' }
    ],
    avoid: [
      { food: 'Excessive spicy food', reason: 'Can trigger inflammation and redness' }
    ]
  }
};

/**
 * Extract skin tone category (light, medium, dark) from specific tone
 */
const getToneCategory = (skinTone: string): 'light' | 'medium' | 'dark' => {
  const tone = skinTone.toLowerCase();
  if (tone.includes('light')) return 'light';
  if (tone.includes('dark')) return 'dark';
  return 'medium';
};

/**
 * Map analysis results to condition keys
 */
const extractConditions = (input: DietPlanInput): string[] => {
  const conditions: string[] = [];

  input.conditions.forEach((cond) => {
    const lower = cond.toLowerCase();

    if (lower.includes('dehydrat') || lower.includes('dry')) {
      conditions.push('dehydration');
    }
    if (lower.includes('pigment') || lower.includes('dark spot') || lower.includes('melasma')) {
      conditions.push('pigmentation');
    }
    if (lower.includes('tan')) {
      conditions.push('tanning');
    }
    if (lower.includes('acne') || lower.includes('breakout') || lower.includes('pimple')) {
      conditions.push('acne');
    }
    if (lower.includes('dark circle') || lower.includes('under-eye')) {
      conditions.push('darkCircles');
    }
    if (lower.includes('lip')) {
      conditions.push('lipPigmentation');
    }
  });

  return [...new Set(conditions)]; // Remove duplicates
};

/**
 * Generate personalized diet plan based on skin tone and conditions
 *
 * @param input - Skin tone and conditions array
 * @returns Personalized diet recommendations
 */
export const generateDietPlan = (input: DietPlanInput): DietRecommendation => {
  const toneCategory = getToneCategory(input.skinTone);
  const conditions = extractConditions(input);

  const foodsToEatMap = new Map<string, { food: string; reason: string }>();
  const foodsToAvoidMap = new Map<string, { food: string; reason: string }>();

  // Add general recommendations for South Asian skin
  DIET_DATABASE.general.eat.forEach((item) => {
    foodsToEatMap.set(item.food, item);
  });
  DIET_DATABASE.general.avoid.forEach((item) => {
    foodsToAvoidMap.set(item.food, item);
  });

  // Add condition-specific recommendations
  conditions.forEach((condition) => {
    const conditionData = DIET_DATABASE.conditions[condition as keyof typeof DIET_DATABASE.conditions];
    if (conditionData) {
      conditionData.eat.forEach((item) => {
        foodsToEatMap.set(item.food, item);
      });
      conditionData.avoid.forEach((item) => {
        foodsToAvoidMap.set(item.food, item);
      });
    }
  });

  // If no specific conditions, add basic skin health foods
  if (conditions.length === 0) {
    DIET_DATABASE.conditions.dehydration.eat.slice(0, 2).forEach((item) => {
      foodsToEatMap.set(item.food, item);
    });
  }

  // Get water intake recommendation
  const dailyWaterIntake = DIET_DATABASE.waterIntake[toneCategory];

  return {
    foodsToEat: Array.from(foodsToEatMap.values()),
    foodsToAvoid: Array.from(foodsToAvoidMap.values()),
    dailyWaterIntake,
    specificToSkinTone: true
  };
};

/**
 * Helper function to generate diet plan from analysis result
 */
export const generateDietPlanFromAnalysis = (analysis: {
  skinTone?: { tone: string };
  hydration?: { dehydrationZones: string[] };
  darkCircles?: { type: number };
  acne?: { overallSeverity: number };
  lipPigmentation?: { melaninIndex: number };
}): DietRecommendation => {
  const conditions: string[] = [];

  // Extract conditions from analysis
  if (analysis.hydration?.dehydrationZones && analysis.hydration.dehydrationZones.length > 0) {
    conditions.push('dehydration');
  }

  if (analysis.darkCircles) {
    conditions.push('dark circles');
  }

  if (analysis.acne && analysis.acne.overallSeverity > 30) {
    conditions.push('acne');
  }

  if (analysis.lipPigmentation && analysis.lipPigmentation.melaninIndex > 50) {
    conditions.push('lip pigmentation');
  }

  // Add tanning/pigmentation as a common South Asian concern
  if (analysis.skinTone?.tone.includes('medium') || analysis.skinTone?.tone.includes('dark')) {
    conditions.push('pigmentation');
  }

  return generateDietPlan({
    skinTone: analysis.skinTone?.tone || 'medium-warm',
    conditions
  });
};
