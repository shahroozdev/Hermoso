# Hermoso — AI Face Scan Feature Redesign

> Developer Change Request — Post Stakeholder Meeting  
> Version 1.0 — March 2026  
> Stakeholders: Wasif Kazmi (CEO, ONE2W) · Tehreem Khan (Co-Founder)  
> Target Build: Hermoso Customer App — Native (Swift / Kotlin) — Sprint 2

---

## 1. What the Client Wants (Requirements)

### 1.1 Core Vision

The AI scan must do a **real, intelligent face scan** — not generic skin metrics. It must analyse the customer's actual face and return a **complete personalised treatment and diet report**, then auto-match to salons that offer the exact recommended treatments.

### 1.2 Key Decision Points

| # | Decision |
|---|---|
| 1 | AI scan must analyse the face **holistically** — not just generic skin metrics |
| 2 | Results must be **human-readable, specific, and actionable** — not just percentages |
| 3 | **Diet recommendations** tied to skin colour and condition must be included |
| 4 | **Eyebrow assessment** (shape, asymmetry, fullness) is a required scan output |
| 5 | After results, system must **auto-match salons** that can deliver the exact treatments |
| 6 | Target audience: primarily **female, South Asian skin types** (Lahore, Karachi, Islamabad launch) |
| 7 | The feature is the main differentiator — **it must feel like a dermatologist, not a filter** |

### 1.3 What Was Demoed (Current Prototype)

- Current AI Skin Scan prototype: 5 generic metrics (hydration, sun damage, clarity, pigmentation, skin barrier)
- Customer App: home, salon discovery, booking flow, progress tracker
- Business App: dashboard, calendar, service listings, client CRM, AI Insights
- Super Admin: salon management, revenue, payouts, notifications, settings

---

## 2. Screens & Change Register

### 2.1 Screen: AI Face Scan (Camera Screen)

| ID | Feature | What Client Wants | Priority | Effort |
|---|---|---|---|---|
| CR-01 | Face detection overlay | Replace generic face emoji placeholder with real face outline oval guide + 8 AI detection point dots mapped to: forehead, left eye, right eye, nose, left cheek, right cheek, chin, lips | 🔴 Critical | 3d |
| CR-02 | Live scan progress checklist | Animated live checklist showing 8 analysis categories: Skin tone & tanning, Eyebrow shape & fullness, Facial treatment needs, Hydration & texture, Dark circles & under-eye, Acne & breakout zones, Lip pigmentation, Diet analysis. States: Waiting → Scanning (animated) → Done | 🔴 Critical | 2d |
| CR-03 | Scan beam animation | Animated scan beam that sweeps top-to-bottom across face oval during analysis. Soft gradient line (not hard line) | 🟠 High | 1d |
| CR-04 | Real-time progress % | Live percentage counter (0–100%) in top-right of scan status bar. Must animate smoothly | 🟠 High | 0.5d |
| CR-05 | South Asian calibration flag | All AI model calls must pass a South Asian skin profile flag. Model must be calibrated for medium-to-dark skin tones | 🔴 Critical | 3d |
| CR-06 | Camera permission handling | Graceful camera permission request flow with explanation. Handle denial with message + settings redirect | 🟠 High | 1d |

### 2.2 Screen: Face Analysis Results

| ID | Feature | What Client Wants | Priority | Effort |
|---|---|---|---|---|
| CR-07 | Overall skin score ring | Circular score ring (0–100) from weighted average of all scan outputs. Dynamic, not static | 🔴 Critical | 1d |
| CR-08 | Skin tone & tanning section | Replace hydration/clarity metrics. Include: detected skin tone (e.g. medium-warm), uneven distribution, tanning pattern, recommended treatments (Tan Correction Facial, Vitamin C Brightening, SPF Routine) | 🔴 Critical | 4d |
| CR-09 | Eyebrow assessment section | Arch shape (flat/natural/over-arched), fullness/sparseness (1–5), left/right symmetry, tail length. Side-by-side comparison visual. Recommend: Threading & Shaping, Brow Tinting, Microblading | 🔴 Critical | 5d |
| CR-10 | Hydration & texture detail | Hydration % reading, zones of dehydration (T-zone, cheeks), texture rating, pore condition. Recommend specific products/treatments | 🟠 High | 2d |
| CR-11 | Dark circles & under-eye section | Classify Type 1 (pigmentation), Type 2 (vascular), Type 3 (structural/sunken). Severity 3-point scale. Recommend: Under-Eye Brightening, Vitamin K Therapy, LED Eye Treatment, Eye Massage | 🔴 Critical | 4d |
| CR-12 | Acne & breakout zone mapping | Map breakout zones on face diagram (forehead, nose, chin, cheeks). Classify: active, healing, hormonal. Recommend: Deep Pore Cleansing, Clay Mask, Acne Facial | 🟠 High | 3d |
| CR-13 | Lip pigmentation section | Lip darkness (melanin index), pigmentation unevenness, dryness level. Recommend: Lip Lightening Treatment, Exfoliation, Hydration Mask | 🟡 Medium | 2d |
| CR-14 | AI Treatment Priority Plan | Numbered 3-step treatment sequence (most → least important). Each step: treatment name, reason linked to finding, PKR price range, duration | 🔴 Critical | 2d |
| CR-15 | Diet & nutrition plan section | Specific to detected skin tone + conditions. Foods to eat (with reasons), foods to avoid, daily water intake. Must feel personalised | 🟠 High | 3d |
| CR-16 | Save & share report | Save Report as PDF or to profile. Share via WhatsApp | 🟡 Medium | 2d |
| CR-17 | Re-scan button | Option to redo analysis with better lighting/positioning | 🟡 Medium | 0.5d |

### 2.3 Screen: AI Matched Salons

| ID | Feature | What Client Wants | Priority | Effort |
|---|---|---|---|---|
| CR-18 | AI match score algorithm | Backend algorithm: match score = (treatments available / treatments needed) × 100, weighted by rating, proximity, price match. Min threshold: 60% | 🔴 Critical | 5d |
| CR-19 | Why matched explanation | Show which treatments each salon can deliver. Visual checkmark tags: "Tan Correction Facial ✓", "Hydra Facial ✓" | 🔴 Critical | 2d |
| CR-20 | Treatment pre-selection on booking | Booking flow pre-populates with all matching treatments. Customer should not need to manually find services | 🔴 Critical | 3d |
| CR-21 | Skin condition chips header | Horizontal scrollable strip of condition chips from scan (Tan Correction, Brow Shaping, Dark Circles) at top of screen | 🟠 High | 1d |
| CR-22 | Filter by treatment type | Filter pills: All / Skin Clinics / Salons / Open Now / Near Me. Filterable by specific treatments mapped to scan findings | 🟠 High | 2d |
| CR-23 | Specialist badge for South Asian skin | Gold badge on salon card if flagged as South Asian skin specialist. Set in Business App settings | 🟡 Medium | 1d |

### 2.4 Screen: Business App — Service Listings

| ID | Feature | What Client Wants | Priority | Effort |
|---|---|---|---|---|
| CR-24 | Link service to AI scan | Dropdown in Add/Edit Service: "Link to AI Scan Recommendation". Options: Not linked, Dehydration, Pigmentation, Tanning, Dark circles, Acne, All concerns. Drives match score | 🔴 Critical | 3d |
| CR-25 | South Asian skin specialist flag | Toggle in Business App Settings: "We specialise in South Asian skin treatments". Boosts AI match + shows gold badge | 🟠 High | 1d |
| CR-26 | AI scan referral tracking | Dashboard metric: "Bookings from AI Scan Match". Shows bookings via AI match flow vs direct search | 🟡 Medium | 2d |

### 2.5 Backend / API — Infrastructure

| ID | Feature | What Client Wants | Priority | Effort |
|---|---|---|---|---|
| CR-27 | AI skin analysis via OpenRouter | Integrate OpenRouter SDK with a vision LLM (GPT-4o / Claude Sonnet 4). Send face photo + structured prompt → receive holistic JSON analysis: skin tone, hydration, dark circles, acne, lip pigmentation, treatment recommendations, diet plan | 🔴 Critical | 7d |
| CR-28 | Eyebrow analysis module | MediaPipe Face Mesh for brow arch angle, symmetry, tail sparseness. Runs on-device (Android: MediaPipe Tasks Kotlin, iOS: Vision framework Swift). No photo leaves device for this step | 🔴 Critical | 5d |
| CR-29 | Scan history storage | Store each scan result against user account with timestamp. Fields: scan date, metrics, treatments, matched salons | 🟠 High | 2d |
| CR-30 | Treatment-to-salon matching API | POST /api/match-salons. Input: treatment IDs. Output: ranked salons with match score, matched treatment tags, available slots. Factor: location, hours, rating, AI scan link tags | 🔴 Critical | 6d |
| CR-31 | Diet plan generation | Rule-based lookup table. Input: skin_tone + conditions[]. Output: recommended foods, foods to avoid, daily water intake | 🟠 High | 2d |

---

## 3. What the App Is Currently Doing

### 3.1 Current State

| Area | Current Implementation | Gap vs Requirements |
|---|---|---|
| **AI Skin Scan** | 5 generic metrics: hydration, sun damage, clarity, pigmentation, skin barrier | Missing holistic analysis: brows, dark circles, diet, acne zones, lip pigmentation, treatment plan |
| **Results** | Shows percentage-based metrics only | Not human-readable, not actionable, no diet plan, no treatment priority |
| **Camera Screen** | Generic face emoji as placeholder | No oval guide, no 8-point detection dots, no scan beam, no live checklist |
| **Salon Matching** | Basic listing by rating/proximity | No AI-driven match scoring, no treatment compatibility, no pre-populated booking |
| **Business App Services** | No AI scan linkage | CR-24 (link service to scan) not implemented |
| **Diet/Nutrition** | Not present | Entire feature needs to be built |
| **Eyebrow Analysis** | Not present | Entire feature needs to be built |
| **Dark Circle Classification** | Not present | Entire feature needs to be built |
| **Lip Pigmentation** | Not present | Entire feature needs to be built |
| **South Asian Calibration** | Not implemented | All AI models need calibration flag |

### 3.2 Current Tech Stack

| Platform | Technology |
|---|---|
| iOS | Swift (native) + Vision framework (on-device brow detection) |
| Android | Kotlin (native) + MediaPipe Tasks (on-device brow detection) |
| Backend | Node.js / Python (serves OpenRouter proxy, matching API, diet engine, scan storage) |
| AI Analysis | OpenRouter SDK (vision LLM: GPT-4o / Claude Sonnet 4) |
| On-device ML | MediaPipe Face Mesh (eyebrow landmarks) |
| Image Processing | OpenCV (lip HSL extraction, dark circle colour delta analysis) |

---

## 4. Steps Required to Implement (Action Plan)

### 4.1 Sprint 2A — Week 1: AI Pipeline — OpenRouter + MediaPipe + OpenCV

| Step | What to Do | CR Ref | Owner |
|---|---|---|---|
| 1.1 | Integrate OpenRouter SDK with vision LLM (GPT-4o / Claude Sonnet 4). Design structured prompt that returns consistent JSON: skin_tone, hydration_level, dark_circles (type 1/2/3), acne_zones, lip_pigmentation, tanning, treatment_recommendations | CR-27 | AI/ML Dev |
| 1.2 | Integrate MediaPipe Face Mesh on-device (Android: Kotlin MediaPipe Tasks, iOS: Swift Vision framework). Extract brow landmarks → compute arch angle, left/right symmetry, tail sparseness | CR-28 | AI/ML Dev |
| 1.3 | Build OpenCV colour analysis module: lip region HSL extraction (from MediaPipe lip landmarks), dark circle periorbital colour delta analysis | CR-11, CR-13 | AI/ML Dev |
| 1.4 | Build prompt engineering with South Asian skin context — include reference skin tones and condition descriptions in the system prompt for calibration | CR-05 | AI/ML Dev |
| 1.5 | Build scan result storage schema and store results against user + timestamp | CR-29 | AI/ML Dev |

### 4.2 Sprint 2B — Week 2: Matching API + Diet Engine + Backend Rules

| Step | What to Do | CR Ref | Owner |
|---|---|---|---|
| 2.1 | Build POST /api/match-salons with scoring algorithm (base score + boosts + penalties) | CR-18, CR-30 | Backend Dev |
| 2.2 | Build rule-based diet plan generator (skin_tone + conditions → foods/avoid/water) | CR-31 | Backend Dev |
| 2.3 | Build treatment-to-service linking in Business App backend | CR-24 | Backend Dev |
| 2.4 | Add South Asian specialist flag to salon model | CR-25 | Backend Dev |
| 2.5 | Build unified ScanResult JSON aggregator (OpenRouter LLM + MediaPipe landmarks + OpenCV colour analysis → single response) | CR-27 | Backend Dev |
| 2.6 | Implement photo deletion after processing (privacy) | — | Backend Dev |

### 4.3 Sprint 2C — Week 3: Native UI — Scan + Results Screens

| Step | What to Do | CR Ref | Owner |
|---|---|---|---|
| 3.1 | Build face oval overlay with 8 detection point dots on camera screen | CR-01 | iOS + Android |
| 3.2 | Build animated live progress checklist (8 categories, 3 states each) | CR-02 | iOS + Android |
| 3.3 | Build scan beam animation (top-to-bottom, soft gradient) | CR-03 | iOS + Android |
| 3.4 | Add real-time progress percentage counter | CR-04 | iOS + Android |
| 3.5 | Implement graceful camera permission flow with denial handling | CR-06 | iOS + Android |
| 3.6 | Build overall skin score ring (0–100, animated) | CR-07 | iOS + Android |
| 3.7 | Build Skin Tone & Tanning section with treatment recommendations | CR-08 | iOS + Android |
| 3.8 | Build Eyebrow Assessment section with left/right comparison visual | CR-09 | iOS + Android |
| 3.9 | Build Hydration & Texture detail section | CR-10 | iOS + Android |
| 3.10 | Build Dark Circles & Under-Eye section with type classification display | CR-11 | iOS + Android |
| 3.11 | Build Acne & Breakout Zone mapping section with face diagram | CR-12 | iOS + Android |
| 3.12 | Build Lip Pigmentation section | CR-13 | iOS + Android |
| 3.13 | Build AI Treatment Priority Plan (3-step numbered) | CR-14 | iOS + Android |
| 3.14 | Build Diet & Nutrition Plan section (foods to eat/avoid, water intake) | CR-15 | iOS + Android |
| 3.15 | Build Save Report (PDF/profile) and Share (WhatsApp) buttons | CR-16 | iOS + Android |
| 3.16 | Build Re-scan button | CR-17 | iOS + Android |

### 4.4 Sprint 2D — Week 4: Salon Match Screen + Business App + QA

| Step | What to Do | CR Ref | Owner |
|---|---|---|---|
| 4.1 | Build AI-matched salons list with match score display | CR-18 | iOS + Android |
| 4.2 | Build "Why matched" treatment checkmark tags for each salon | CR-19 | iOS + Android |
| 4.3 | Implement treatment pre-selection on booking (pre-populate from scan) | CR-20 | iOS + Android + BE |
| 4.4 | Build skin condition chips header (horizontal scrollable) | CR-21 | iOS + Android |
| 4.5 | Build filter pills: All / Skin Clinics / Salons / Open Now / Near Me | CR-22 | iOS + Android |
| 4.6 | Build gold South Asian specialist badge on salon cards | CR-23 | iOS + Android |
| 4.7 | Add "Link to AI Scan Recommendation" dropdown in Business App service form | CR-24 | iOS + Android + BE |
| 4.8 | Add "South Asian skin specialist" toggle in Business App settings | CR-25 | iOS + Android + BE |
| 4.9 | Add "Bookings from AI Scan Match" metric to Business App dashboard | CR-26 | Backend + FE |
| 4.10 | Full integration QA across iOS + Android | — | Full team + QA |

### 4.5 Week 5: Demo Readiness

| Step | What to Do |
|---|---|
| 5.1 | Full AI scan flow live on test device |
| 5.2 | Ready for Tehreem demo & beta salon onboarding |

---

## 5. Data Flow — AI Scan to Salon Match

```
1. Customer opens AI Scan screen → grants camera permission
2. App captures high-res front-facing photo (min 720p)
   - Android: CameraX (Kotlin)
   - iOS: AVFoundation (Swift)
3. App runs MediaPipe Face Mesh on-device → extracts brow landmarks
   - Android: MediaPipe Tasks for Android
   - iOS: Vision framework
   - No photo leaves device at this stage
4. Photo sent to backend via POST /api/scan (user_id + device_metadata + brow_landmarks)
5. Backend runs OpenCV colour analysis on photo:
   - Extract lip region HSL (from MediaPipe lip landmarks)
   - Periorbital colour delta for dark circle type classification
6. Backend sends photo + brow data + colour data to OpenRouter vision LLM
   - Prompt asks for: skin_tone, hydration, dark_circles_type, acne_zones,
     lip_pigmentation, treatment_recommendations, overall_score
   - Model: GPT-4o or Claude Sonnet 4
7. Backend aggregates: OpenRouter LLM response + MediaPipe landmarks + OpenCV
   → unified ScanResult JSON
8. ScanResult → diet plan generator (rule-based: skin_tone + conditions[])
9. Backend calls POST /api/match-salons (recommended_treatments[])
10. All results (scan + diet + matched salons) returned in single response
11. Face photo deleted from server immediately after processing
12. ScanResult stored in user's scan history (for Progress Tracker)
13. App renders Screen 2 (Results) + Screen 3 (Matched Salons)
```

---

## 6. Matching Algorithm Logic

| Component | Rule |
|---|---|
| **Base score** | (matching treatments / total recommended) × 100 |
| **Proximity boost** | +5 if ≤2km, +3 if ≤5km |
| **Rating boost** | +5 if ≥4.8, +3 if ≥4.5 |
| **South Asian specialist boost** | +8 if specialist flag enabled |
| **Price match boost** | +3 if avg price within 20% of customer's budget (if set) |
| **Availability penalty** | −10 if no slots in next 7 days |
| **Min display threshold** | Score ≥ 60 |
| **Max display count** | Top 5, ranked highest → lowest |

---

## 7. AI Stack — Architecture (No Third-Party Skin APIs)

### 7.1 Stack Overview

```
┌──────────────────────────────────────────────────┐
│                 ON-DEVICE (Native)                │
│                                                   │
│  MediaPipe Face Mesh                              │
│  ├─ 468 facial landmarks                          │
│  ├─ Eyebrow: arch angle, left/right symmetry,     │
│  │   tail sparseness, fullness score (1-5)        │
│  ├─ Lip region: extract landmark coordinates       │
│  └─ Runs entirely on-device → no photo sent yet   │
│                                                   │
│  Android: MediaPipe Tasks SDK (Kotlin)            │
│  iOS: Vision framework (Swift)                    │
└───────────────────────┬──────────────────────────┘
                        │ brow_landmarks[]
                        ▼
┌──────────────────────────────────────────────────┐
│              BACKEND (Server-side)                │
│                                                   │
│  1. OpenCV Colour Analysis                        │
│     ├─ Lip region: extract HSL values from        │
│     │   MediaPipe landmark coords → melanin index │
│     └─ Periorbital area: colour delta analysis    │
│         → dark circle Type 1/2/3 classification   │
│                                                   │
│  2. OpenRouter SDK → Vision LLM                   │
│     ├─ Send photo + brow_landmarks + colour data  │
│     ├─ Model: GPT-4o or Claude Sonnet 4           │
│     ├─ System prompt includes South Asian skin    │
│     │   calibration context                       │
│     └─ Returns structured JSON:                   │
│        {                                          │
│          skin_tone: "medium-warm",                │
│          tanning: { pattern, severity },          │
│          hydration: { level, zones },             │
│          dark_circles: { type: 1|2|3, severity }, │
│          acne: { zones[], type },                 │
│          lip_pigmentation: { melanin, dryness },  │
│          treatments: [{ name, reason, pkr }],     │
│          diet: { eat[], avoid[], water_intake },  │
│          overall_score: 78                        │
│        }                                          │
│                                                   │
│  3. Rule-based Diet Engine                        │
│     ├─ Lookup by skin_tone + conditions[]         │
│     └─ Personalised foods, avoid list, water      │
│                                                   │
│  4. Salon Matching Engine                         │
│     ├─ Cross-reference treatments[] vs salons     │
│     └─ Scoring algorithm with boosts/penalties    │
└──────────────────────────────────────────────────┘
```

### 7.2 Component Breakdown

| Component | Role | Runs On | Privacy | Cost |
|---|---|---|---|---|
| **MediaPipe Face Mesh** | Brow landmarks (468 points), lip region coordinates | Device (iOS/Android) | ✅ Photo never leaves | Free (open-source) |
| **OpenCV** | Lip HSL extraction, dark circle colour delta | Backend | ⚠️ Needs photo | Free (open-source) |
| **OpenRouter → Vision LLM** | Holistic skin analysis, treatment recs, diet | Backend → API | ⚠️ Needs photo | ~$0.003–0.01/scan |
| **Rule-based Engine** | Diet plan, match scoring | Backend | ✅ No photo needed | Free |

### 7.3 Why This Approach

| Concern | Third-party skin APIs (Haut.AI etc.) | OpenRouter + MediaPipe + OpenCV |
|---|---|---|
| Vendor lock-in | High — proprietary models, custom formats | None — switch LLM models anytime |
| South Asian calibration | Uncertain — must verify with vendor | Full control via prompt engineering |
| Eyebrow analysis | Limited or absent | Precise via MediaPipe 468 landmarks |
| Dark circle classification | May not support Type 1/2/3 | Custom OpenCV logic specific to need |
| Cost per scan | $0.05–0.20+ (licensing + per-call) | ~$0.01 (OpenRouter) + free (MediaPipe/OpenCV) |
| Data control | Photo sent to third party | Photo deleted after processing |
| Iteration speed | Slow — wait for vendor updates | Fast — tweak prompts/rules anytime |

---

## 8. Privacy & Security

- Face photos must **NOT** be stored permanently on the server
- Process image → extract feature data → **delete the photo**
- Only structured `ScanResult` JSON (no image) should be stored
- Customers must be informed of this in UI and privacy policy

---

## 9. Acceptance Criteria (Beta Sign-off)

The AI Face Scan feature is considered **complete and ready for beta** when ALL criteria are met:

| # | Criterion |
|---|---|
| 1 | Camera screen shows face oval with animated scan beam and live 8-point checklist |
| 2 | AI accurately identifies skin tone (light / medium / medium-dark / dark) for South Asian faces |
| 3 | Eyebrow asymmetry and shape analysis produces correct left/right comparison output |
| 4 | Dark circle type classification returns Type 1, 2, or 3 with correct treatment recommendations |
| 5 | Diet plan output is specific to detected skin tone and conditions — not generic |
| 6 | Matched salons are ranked by actual treatment compatibility, not just rating or proximity |
| 7 | Booking from matched salons screen pre-populates with AI-recommended treatments |
| 8 | Face photos are deleted from server after processing — confirmed by backend logs |
| 9 | Scan history is stored and viewable in the Progress Tracker screen |
| 10 | Full flow tested on both iOS (Swift) and Android (Kotlin) on devices with medium/dark skin tones. Feature parity before sign-off |
| 11 | Tehreem Khan to review and sign off the results screen output before beta launch |

---

## 10. Architecture Note

> **Hermoso uses native technologies**: Swift for iOS, Kotlin for Android.  
> There is **no shared UI layer** — every screen and component must be built twice (once per platform) and reach feature parity before sign-off.  
> The backend, OpenRouter integration, OpenCV colour analysis, rule-based diet engine, and matching logic are **shared and platform-independent**.

### 10.1 No Third-Party Skin APIs

This architecture uses **zero third-party skin analysis APIs** (no Haut.AI, SkinAI, ModiFace, or similar). Instead:

| Analysis Need | How It's Done |
|---|---|
| Skin tone classification | Vision LLM via OpenRouter (prompt-engineered for South Asian tones) |
| Eyebrow asymmetry/shape | MediaPipe Face Mesh on-device (468 landmarks) |
| Dark circle type classification | OpenCV periorbital colour delta analysis |
| Lip pigmentation | OpenCV HSL extraction from MediaPipe lip region |
| Acne zone mapping | Vision LLM via OpenRouter |
| Hydration/texture assessment | Vision LLM via OpenRouter |
| Tanning analysis | Vision LLM via OpenRouter |
| Treatment recommendations | Vision LLM via OpenRouter (with structured output) |
| Diet/nutrition plan | Rule-based lookup engine (by skin_tone + conditions) |
| Salon matching | Rule-based scoring algorithm (no AI needed) |

### 10.2 OpenRouter Notes

- **SDK**: Use `openai` Python/Node SDK with OpenRouter base URL (`https://openrouter.ai/api/v1`)
- **Recommended model**: `openai/gpt-4o` or `anthropic/claude-sonnet-4` (best vision + reasoning balance)
- **Fallback model**: `google/gemini-2.5-pro` (cheaper, good for high volume)
- **Structured output**: Use constrained JSON mode or function calling for consistent response format
- **Rate limiting**: Paid tier ($10+ credits) removes daily limits; set up queue for concurrent scans
- **Prompt caching**: Repeated context (South Asian skin reference data) → ~60% cost reduction
