import { useRef, useState, useEffect } from "react";
import { scanService, type ScanResult } from "../../services/scanService";

const SCAN_STEPS = [
  { key: "skinTone", label: "Skin Tone & Tanning" },
  { key: "eyebrows", label: "Eyebrow Shape & Fullness" },
  { key: "hydration", label: "Hydration & Texture" },
  { key: "darkCircles", label: "Dark Circles & Under-Eye" },
  { key: "acne", label: "Acne & Breakout Zones" },
  { key: "lipPigmentation", label: "Lip Pigmentation" },
  { key: "treatmentPlan", label: "Facial Treatment Needs" },
  { key: "dietPlan", label: "Diet Analysis" },
];

const DARK_CIRCLE_LABELS: Record<number, string> = {
  1: "Pigmentation (brownish)",
  2: "Vascular (bluish/purplish)",
  3: "Structural (sunken/hollow)",
};

const DARK_CIRCLE_COLORS: Record<number, string> = {
  1: "#a855f7",
  2: "#3b82f6",
  3: "#f59e0b",
};

const ACNE_TYPE_COLORS: Record<string, string> = {
  active: "#ef4444",
  healing: "#f59e0b",
  hormonal: "#ec4899",
  none: "#94a3b8",
};

const SCORE_COLOR = (score: number) => {
  if (score >= 75) return "#10b981";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
};

const ScoreRing = ({ score, size = 120 }: { score: number; size?: number }) => {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = SCORE_COLOR(score);

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-soft)"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-2xl font-bold" style={{ color }}>
        {score}
      </span>
    </div>
  );
};

const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="shell-panel rounded-2xl p-5 space-y-3">
    <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">
      {title}
    </h3>
    {children}
  </div>
);

const TreatmentTag = ({ label }: { label: string }) => (
  <span className="rounded-lg bg-[var(--accent)]/10 px-3 py-1.5 text-xs font-medium text-[var(--accent)]">
    {label}
  </span>
);

const ScanPage = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");
  const [showGuidance, setShowGuidance] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState<string | null>(null);

  // Simulate scan progress during analysis
  useEffect(() => {
    if (!analyzing) return;

    const totalDuration = 5000;
    const stepInterval = totalDuration / SCAN_STEPS.length;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = Math.min(
        100,
        Math.round((currentStep / SCAN_STEPS.length) * 100),
      );
      setScanProgress(progress);

      const stepIndex = Math.min(currentStep - 1, SCAN_STEPS.length - 1);
      const stepKey = SCAN_STEPS[stepIndex].key;

      if (currentStep <= SCAN_STEPS.length) {
        setActiveStep(stepKey);
        setCompletedSteps((prev) => {
          if (prev.includes(stepKey)) return prev;
          return [...prev, stepKey];
        });
      }

      if (currentStep >= SCAN_STEPS.length) {
        clearInterval(timer);
        setActiveStep(null);
      }
    }, stepInterval);

    return () => clearInterval(timer);
  }, [analyzing]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setResult(null);
    setShowGuidance(false);
    setPreview(URL.createObjectURL(file));
    analyzeImage(file);
  };

  const analyzeImage = async (file: File) => {
    setAnalyzing(true);
    setError("");
    setScanProgress(0);
    setCompletedSteps([]);
    try {
      const res = await scanService.analyze(file);
      if (!res.success && res.data?.faceValid === false) {
        setShowGuidance(true);
        setError(res.message || "Image failed face quality check");
        setResult(res.data);
        return;
      }
      setResult(res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Analysis failed. Try a clearer photo.";
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setError("");
    setShowGuidance(false);
    setScanProgress(0);
    setCompletedSteps([]);
    setActiveStep(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveReport = () => {
    const content = document.getElementById("scan-report");
    if (!content) return;
    const clone = content.cloneNode(true) as HTMLElement;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Hermoso - Skin Analysis Report</title></head>
          <body>${clone.innerHTML}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleShare = () => {
    const url = window.location.origin + "/customer/scan-results";
    const text = `Check out my AI Skin Analysis report from Hermoso! ${url}`;
    const whatsapp = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsapp, "_blank");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="shell-panel rounded-2xl p-6">
        <h2 className="text-2xl font-semibold">AI Skin Scan</h2>
        <p className="mt-1 text-sm text-muted">
          Upload a selfie for professional AI-powered skin analysis
        </p>
      </div>

      {!preview && (
        <div className="shell-panel rounded-2xl p-8 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--surface-soft)]">
            <svg
              className="h-10 w-10 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
              />
            </svg>
          </div>
          <p className="mb-2 text-sm text-muted">
            Take a well-lit, front-facing selfie for best results
          </p>
          <ul className="mb-6 space-y-1 text-xs text-muted">
            <li>• Ensure your full face is visible</li>
            <li>• Avoid harsh shadows or glare</li>
            <li>• Remove masks or heavy accessories</li>
          </ul>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl bg-[var(--accent-2)] px-6 py-3 font-semibold text-[var(--bg)]"
          >
            Upload Photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      )}

      {preview && analyzing && (
        <div className="shell-panel rounded-2xl overflow-hidden">
          <div className="relative">
            <img
              src={preview}
              alt="Uploaded"
              className="w-full max-h-96 object-contain bg-black/5"
            />
            {/* Scan beam animation (CR-03) */}
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute left-0 right-0 h-0.5 transition-all duration-300 ease-linear"
                style={{
                  top: `${(scanProgress / 100) * 100}%`,
                  background:
                    "linear-gradient(90deg, transparent, var(--accent-2), transparent)",
                  opacity: 0.7,
                  boxShadow: "0 0 12px var(--accent-2)",
                }}
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          </div>

          {/* Live checklist (CR-02) + Progress % (CR-04) */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                Analysis in progress...
              </span>
              <span className="text-sm font-bold text-[var(--accent-2)]">
                {scanProgress}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--surface-soft)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--accent-2)] transition-all duration-300 ease-out"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
              {SCAN_STEPS.map((step) => {
                const isDone = completedSteps.includes(step.key);
                const isActive = activeStep === step.key;
                return (
                  <div
                    key={step.key}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                      isDone
                        ? "bg-emerald-500/10 text-emerald-600"
                        : isActive
                          ? "bg-[var(--accent)]/10 text-[var(--accent)] animate-pulse"
                          : "text-muted"
                    }`}
                  >
                    {isDone ? (
                      <svg
                        className="h-4 w-4 shrink-0"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.36 5.65l-4 4a.5.5 0 01-.7 0l-2-2a.5.5 0 11.7-.7L7 9.29l3.65-3.64a.5.5 0 01.7.7z" />
                      </svg>
                    ) : isActive ? (
                      <svg
                        className="h-4 w-4 shrink-0 animate-spin"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <circle
                          cx="8"
                          cy="8"
                          r="6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray="30 10"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4 shrink-0"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        opacity="0.4"
                      >
                        <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 13A6 6 0 118 2a6 6 0 010 12z" />
                      </svg>
                    )}
                    <span>{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {error && !analyzing && (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-600">
          <p className="font-semibold">{error}</p>
          {showGuidance && result?.faceGuidance?.length ? (
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
              {result.faceGuidance.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          ) : null}
          <button
            onClick={reset}
            className="mt-3 text-xs font-semibold underline underline-offset-2"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Results */}
      {result?.faceValid && (
        <div id="scan-report" className="space-y-6">
          {/* Overall score ring (CR-07) + Summary */}
          <div className="shell-panel rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ScoreRing score={result.overallSkinScore} size={120} />
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-semibold">
                  Your Skin Health Score
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {result.summary}
                </p>
              </div>
            </div>
          </div>

          {/* Skin Tone & Tanning (CR-08) */}
          <SectionCard title="Skin Tone & Tanning">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted">Detected Tone</p>
                <p className="text-sm font-semibold capitalize">
                  {result.skinTone.tone}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Evenness</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-500"
                      style={{ width: `${result.skinTone.evenness}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">
                    {result.skinTone.evenness}%
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted">Tanning Pattern</p>
              <p className="mt-1 text-sm">{result.skinTone.tanningPattern}</p>
            </div>
            {result.skinTone.recommendedTreatments?.length ? (
              <div className="flex flex-wrap gap-2">
                {result.skinTone.recommendedTreatments.map((t) => (
                  <TreatmentTag key={t} label={t} />
                ))}
              </div>
            ) : null}
          </SectionCard>

          {/* Eyebrow Assessment (CR-09) */}
          {result.eyebrows ? (
            <SectionCard title="Eyebrow Assessment">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted">Arch Shape</p>
                  <p className="text-sm font-semibold capitalize">
                    {result.eyebrows.archShape}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Fullness</p>
                  <p className="text-sm font-semibold">
                    {result.eyebrows.fullness}/5
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Symmetry</p>
                  <p className="text-sm font-semibold">
                    {result.eyebrows.leftRightSymmetry}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Tail Length</p>
                  <p className="text-sm font-semibold capitalize">
                    {result.eyebrows.tailLength}
                  </p>
                </div>
              </div>
              {result.eyebrows.recommendedTreatments?.length ? (
                <div className="flex flex-wrap gap-2">
                  {result.eyebrows.recommendedTreatments.map((t) => (
                    <TreatmentTag key={t} label={t} />
                  ))}
                </div>
              ) : null}
            </SectionCard>
          ) : null}

          {/* Hydration & Texture (CR-10) */}
          <SectionCard title="Hydration & Texture">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted">Hydration Level</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-sky-500"
                      style={{ width: `${result.hydration.hydrationPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">
                    {result.hydration.hydrationPercent}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted">Texture Rating</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${result.hydration.textureRating}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">
                    {result.hydration.textureRating}%
                  </span>
                </div>
              </div>
            </div>
            {result.hydration.dehydrationZones?.length ? (
              <div>
                <p className="text-xs text-muted">Dehydration Zones</p>
                <p className="mt-1 text-sm capitalize">
                  {result.hydration.dehydrationZones.join(", ")}
                </p>
              </div>
            ) : null}
            {result.hydration.poreCondition ? (
              <div>
                <p className="text-xs text-muted">Pore Condition</p>
                <p className="mt-1 text-sm">{result.hydration.poreCondition}</p>
              </div>
            ) : null}
            {result.hydration.recommendedTreatments?.length ? (
              <div className="flex flex-wrap gap-2">
                {result.hydration.recommendedTreatments.map((t) => (
                  <TreatmentTag key={t} label={t} />
                ))}
              </div>
            ) : null}
          </SectionCard>

          {/* Dark Circles & Under-Eye (CR-11) */}
          <SectionCard title="Dark Circles & Under-Eye">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted">Type</p>
                <p
                  className="text-sm font-semibold"
                  style={{ color: DARK_CIRCLE_COLORS[result.darkCircles.type] }}
                >
                  Type {result.darkCircles.type} —{" "}
                  {DARK_CIRCLE_LABELS[result.darkCircles.type]}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Severity</p>
                <p className="text-sm font-semibold capitalize">
                  {result.darkCircles.severity}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Color Delta</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${result.darkCircles.colorDelta}%`,
                        backgroundColor:
                          DARK_CIRCLE_COLORS[result.darkCircles.type],
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold">
                    {Math.round(result.darkCircles.colorDelta)}%
                  </span>
                </div>
              </div>
            </div>
            {result.darkCircles.recommendedTreatments?.length ? (
              <div className="flex flex-wrap gap-2">
                {result.darkCircles.recommendedTreatments.map((t) => (
                  <TreatmentTag key={t} label={t} />
                ))}
              </div>
            ) : null}
          </SectionCard>

          {/* Acne & Breakout Zones (CR-12) */}
          <SectionCard title="Acne & Breakout Zones">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted">Overall Severity</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-rose-500"
                      style={{ width: `${result.acne.overallSeverity}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">
                    {result.acne.overallSeverity}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted">Affected Zones</p>
                <p className="text-sm capitalize">
                  {result.acne.zones
                    ?.filter((z) => z.type !== "none")
                    .map((z) => z.area)
                    .join(", ") || "None detected"}
                </p>
              </div>
            </div>
            {result.acne.zones?.filter((z) => z.type !== "none").length ? (
              <div className="grid gap-2 sm:grid-cols-3">
                {result.acne.zones
                  .filter((z) => z.type !== "none")
                  .map((zone) => (
                    <div
                      key={zone.area}
                      className="rounded-lg border border-[var(--border)] p-3"
                    >
                      <p className="text-xs font-semibold capitalize">
                        {zone.area}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-rose-500"
                            style={{ width: `${zone.severity}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">
                          {zone.severity}%
                        </span>
                      </div>
                      <span
                        className="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `${ACNE_TYPE_COLORS[zone.type]}15`,
                          color: ACNE_TYPE_COLORS[zone.type],
                        }}
                      >
                        {zone.type}
                      </span>
                    </div>
                  ))}
              </div>
            ) : null}
            {result.acne.recommendedTreatments?.length ? (
              <div className="flex flex-wrap gap-2">
                {result.acne.recommendedTreatments.map((t) => (
                  <TreatmentTag key={t} label={t} />
                ))}
              </div>
            ) : null}
          </SectionCard>

          {/* Lip Pigmentation (CR-13) */}
          <SectionCard title="Lip Pigmentation">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted">Darkness Level</p>
                <p className="text-sm font-semibold capitalize">
                  {result.lipPigmentation.darknessLevel}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Melanin Index</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-pink-600"
                      style={{
                        width: `${result.lipPigmentation.melaninIndex}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold">
                    {result.lipPigmentation.melaninIndex}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted">Unevenness</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange-500"
                      style={{ width: `${result.lipPigmentation.unevenness}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">
                    {result.lipPigmentation.unevenness}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted">Dryness Level</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-[var(--surface-soft)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{
                        width: `${result.lipPigmentation.drynessLevel}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold">
                    {result.lipPigmentation.drynessLevel}%
                  </span>
                </div>
              </div>
            </div>
            {result.lipPigmentation.recommendedTreatments?.length ? (
              <div className="flex flex-wrap gap-2">
                {result.lipPigmentation.recommendedTreatments.map((t) => (
                  <TreatmentTag key={t} label={t} />
                ))}
              </div>
            ) : null}
          </SectionCard>

          {/* Treatment Priority Plan (CR-14) */}
          {result.treatmentPlan?.length ? (
            <SectionCard title="AI Treatment Priority Plan">
              <div className="space-y-3">
                {result.treatmentPlan
                  .sort((a, b) => a.priority - b.priority)
                  .map((item) => (
                    <div
                      key={item.priority}
                      className="rounded-xl border border-[var(--border)] p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${
                              item.priority === 1
                                ? "bg-rose-500"
                                : item.priority === 2
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            }`}
                          >
                            {item.priority}
                          </span>
                          <div>
                            <p className="text-sm font-semibold">
                              {item.treatmentName}
                            </p>
                            <p className="text-xs text-muted mt-0.5">
                              {item.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-4 text-xs text-muted">
                        <span>PKR {item.pkrPriceRange}</span>
                        <span>{item.estimatedDuration}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </SectionCard>
          ) : null}

          {/* Diet & Nutrition Plan (CR-15) */}
          {result.dietPlan ? (
            <SectionCard title="Diet & Nutrition Plan">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                    Foods to Eat
                  </p>
                  <ul className="space-y-2">
                    {result.dietPlan.foodsToEat.map((item) => (
                      <li key={item.food} className="flex gap-2 text-xs">
                        <span className="mt-0.5 shrink-0 text-emerald-500">
                          +
                        </span>
                        <div>
                          <span className="font-medium">{item.food}</span>
                          <span className="text-muted"> — {item.reason}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-600">
                    Foods to Avoid
                  </p>
                  <ul className="space-y-2">
                    {result.dietPlan.foodsToAvoid.map((item) => (
                      <li key={item.food} className="flex gap-2 text-xs">
                        <span className="mt-0.5 shrink-0 text-rose-500">−</span>
                        <div>
                          <span className="font-medium">{item.food}</span>
                          <span className="text-muted"> — {item.reason}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-[var(--surface-soft)] p-3">
                <p className="text-xs text-muted">💧 Daily Water Intake</p>
                <p className="text-sm font-semibold">
                  {result.dietPlan.dailyWaterIntake}
                </p>
              </div>
            </SectionCard>
          ) : null}

          {/* Recommended Services (from matched backend) */}
          {result.recommendedServices?.length ? (
            <SectionCard title="Recommended Services">
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from(
                  new Map(
                    (result?.recommendedServices ?? []).map((service) => [
                      service.name.toLowerCase(),
                      service,
                    ]),
                  ).values(),
                )?.map((svc) => (
                  <div
                    key={svc._id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4"
                  >
                    <p className="font-semibold text-sm">{svc.name}</p>
                    <p className="mt-1 text-xs text-muted">
                      PKR {svc.price} &middot; {svc.duration} min
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {/* Actions: Save & Share (CR-16) + Re-scan (CR-17) */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSaveReport}
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium text-muted hover:border-[var(--accent)] transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M11 2H5a1 1 0 00-1 1v10l4-2 4 2V3a1 1 0 00-1-1z" />
              </svg>
              Save Report
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium text-muted hover:border-[var(--accent)] transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.5 3a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM5.5 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM13.5 13a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path
                  d="M5.82 9.16l4.36 2.68M10.18 4.16l-4.36 2.68"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
              Share via WhatsApp
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-medium text-muted hover:border-[var(--accent)] transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8 3a5 5 0 00-4.33 2.5.5.5 0 11-.87-.5A6 6 0 1114 10a.5.5 0 11-1 0 5 5 0 00-5-5z"
                  clipRule="evenodd"
                />
              </svg>
              Re-scan
            </button>
            <a
              href="/customer/scan-results"
              className="flex items-center gap-2 rounded-xl bg-[var(--accent-2)] px-4 py-3 text-sm font-semibold text-[var(--bg)]"
            >
              View Full Report
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanPage;
