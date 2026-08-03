"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  DollarSign,
  Image,
  TrendingUp,
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { GlassCard } from "@/components/ui/glass-card";
import { FormInput } from "@/components/ui/form-input";
import { FormSelect } from "@/components/ui/form-select";
import { FormTextarea } from "@/components/ui/form-textarea";
import { IndustrySelector } from "@/components/ui/industry-selector";
import { CountrySelector } from "@/components/ui/country-selector";
import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import {
  createStartup,
  updateStartup,
  setStartupPublishStatus,
  getStartupMeta,
  uploadStartupLogo,
  uploadStartupPitchDeck,
} from "@/lib/services/startupService";
import { showToast } from "@/lib/toast";

const STEPS = [
  { id: 1, label: "Basic Info", icon: Building2 },
  { id: 2, label: "Industry", icon: Building2 },
  { id: 3, label: "Funding", icon: DollarSign },
  { id: 4, label: "Media", icon: Image },
  { id: 5, label: "Traction", icon: TrendingUp },
];

// Mirrors the backend's REQUIRED_FOR_PUBLISH list (models/startup.model.js).
// Kept as a named, documented constant — if the backend list changes, this
// is the one place on the frontend that needs to change with it. Long term,
// this could also be read from the `requiredForPublish` field already
// returned by GET /api/startups/meta instead of duplicated here.
const REQUIRED_FOR_PUBLISH = [
  "name", "description", "sector", "stage", "fundingTarget", "registrationCountry",
];

// Fallback option lists used only if /api/startups/meta can't be reached —
// keeps the form usable, but the source of truth is always the live fetch.
const FALLBACK_META = {
  sectors: [
    { value: "saas", label: "SaaS" },
    { value: "fintech", label: "Fintech" },
    { value: "healthtech", label: "HealthTech" },
    { value: "ecommerce", label: "E-commerce" },
    { value: "ai-ml", label: "AI / ML" },
    { value: "other", label: "Other" },
  ],
  stages: [
    { value: "pre-seed", label: "Pre-seed" },
    { value: "seed", label: "Seed" },
  ],
  countries: [
    { value: "pakistan", label: "Pakistan" },
    { value: "other", label: "Other" },
  ],
  currencies: [{ value: "USD", label: "USD ($)" }],
};

function validateStep(stepId, formData) {
  const errors = {};
  if (stepId === 1) {
    if (!formData.name.trim()) errors.name = "Startup name is required";
    if (!formData.tagline.trim()) errors.tagline = "Tagline is required";
    if (!formData.description.trim()) errors.description = "Description is required";
  }
  if (stepId === 2) {
    if (!formData.sector) errors.sector = "Select an industry";
    if (!formData.stage) errors.stage = "Funding stage is required";
    if (!formData.registrationCountry) errors.registrationCountry = "Registration country is required";
  }
  if (stepId === 3) {
    if (!formData.fundingTarget || Number(formData.fundingTarget) < 10000) {
      errors.fundingTarget = "Funding target must be at least $10,000";
    }
  }
  return errors;
}

const emptyFormData = {
  name: "",
  tagline: "",
  description: "",
  sector: "",
  stage: "",
  registrationCountry: "",
  city: "",
  fundingTarget: "",
  fundingRaised: "",
  currency: "USD",
  logo: null,
  pitchDeck: null,
  customersCount: "",
  monthlyRevenue: "",
  growthNotes: "",
};

export default function CreateStartupPage() {
  const router = useRouter();
  const [meta, setMeta] = useState(FALLBACK_META);
  const [startupId, setStartupId] = useState(null);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState(null); // 'logo' | 'pitchDeck' | null
  const [activeStep, setActiveStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState(emptyFormData);

  const autosaveTimer = useRef(null);
  const startupIdRef = useRef(null); // avoids stale closures inside the debounce timer
  startupIdRef.current = startupId;

  // Load canonical enum options once. This is what prevents "SaaS is not a
  // valid enum"-class bugs from ever coming back — the form only ever
  // offers values the backend actually accepts.
  useEffect(() => {
    let cancelled = false;
    getStartupMeta().then((data) => {
      if (!cancelled && data) setMeta(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    scheduleAutosave();
  };

  // --- Autosave: create-on-first-progress, then debounced PUT ------------
  //
  // The first time the person has enough to identify a draft (a name), we
  // create the record and keep its id. Every subsequent change debounces
  // into a PUT against that id. This is what makes "Save Draft" a real
  // action instead of a no-op, and what allows files to be uploaded
  // immediately against a real backend record (see handleFileChange below).

  function buildDraftPayload() {
    return {
      startupName: formData.name || undefined,
      tagline: formData.tagline || undefined,
      description: formData.description || undefined,
      sector: formData.sector || undefined,
      stage: formData.stage || undefined,
      registrationCountry: formData.registrationCountry || undefined,
      city: formData.city || undefined,
      fundingTarget: formData.fundingTarget ? Number(formData.fundingTarget) : undefined,
      fundingRaised: formData.fundingRaised ? Number(formData.fundingRaised) : undefined,
      currency: formData.currency || undefined,
      customersCount: formData.customersCount ? Number(formData.customersCount) : undefined,
      monthlyRevenue: formData.monthlyRevenue ? Number(formData.monthlyRevenue) : undefined,
      growthNotes: formData.growthNotes || undefined,
    };
  }

  async function persistDraft() {
    if (!formData.name.trim()) return; // nothing worth saving yet
    setSaveState("saving");
    try {
      if (!startupIdRef.current) {
        const created = await createStartup(buildDraftPayload());
        setStartupId(created._id);
        startupIdRef.current = created._id;
      } else {
        await updateStartup(startupIdRef.current, buildDraftPayload());
      }
      setSaveState("saved");
    } catch (error) {
      console.error("Autosave failed:", error);
      setSaveState("idle");
    }
  }

  function scheduleAutosave() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(persistDraft, 1200);
  }

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  // Warn on tab close only while there's a pending, not-yet-flushed change.
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (saveState === "saving" || autosaveTimer.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveState]);

  // --- File uploads: real multipart, immediately, against the draft id ---

  const handleFileChange = async (field, file, meta) => {
    if (meta?.error) {
      showToast(meta.error, "error");
      return;
    }
    updateField(field, file);
    if (!file) return;

    // A draft record must exist before a file can be attached to it.
    if (!startupIdRef.current) {
      await persistDraft();
      if (!startupIdRef.current) {
        showToast("Please add a startup name before uploading files", "error");
        return;
      }
    }

    setUploadingField(field);
    try {
      const uploader = field === "logo" ? uploadStartupLogo : uploadStartupPitchDeck;
      const result = await uploader(startupIdRef.current, file);
      const url = field === "logo" ? result.url : result.pitchDeck;
      updateField(field, url); // swap local File -> real remote URL
      showToast(`${field === "logo" ? "Logo" : "Pitch deck"} uploaded`, "success");
    } catch (error) {
      console.error(`Upload failed (${field}):`, error);
      showToast(`Failed to upload ${field === "logo" ? "logo" : "pitch deck"}`, "error");
      updateField(field, null);
    } finally {
      setUploadingField(null);
    }
  };

  const goToStep = (stepId) => {
    setActiveStep(stepId);
    setErrors({});
  };

  const handleNext = () => {
    const stepErrors = validateStep(activeStep, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    if (activeStep < STEPS.length) setActiveStep(activeStep + 1);
  };

  const handleBack = () => {
    setErrors({});
    if (activeStep > 1) setActiveStep(activeStep - 1);
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    await persistDraft();
    setIsSubmitting(false);
    if (startupIdRef.current) {
      showToast("Draft saved!", "success");
    } else {
      showToast("Add a startup name to save a draft", "error");
    }
  };

  const handlePublish = async () => {
    for (const step of STEPS) {
      const stepErrors = validateStep(step.id, formData);
      if (Object.keys(stepErrors).length > 0) {
        setActiveStep(step.id);
        setErrors(stepErrors);
        showToast(`Please complete "${step.label}" before publishing`, "error");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);

      if (!startupIdRef.current) {
        const created = await createStartup(buildDraftPayload());
        setStartupId(created._id);
        startupIdRef.current = created._id;
      } else {
        await updateStartup(startupIdRef.current, buildDraftPayload());
      }

      // The backend re-validates completeness here regardless of the
      // client-side checks above — see publishStartup / getMissingPublishFields.
      await setStartupPublishStatus(startupIdRef.current, "published");

      showToast("Startup published! Redirecting...", "success");
      router.push("/startups");
    } catch (error) {
      console.error("Publish failed:", error);
      const message = error?.message?.includes("required fields")
        ? error.message
        : "Failed to publish startup. Please try again.";
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Completion is a pure function of the same fields the backend requires
  // to publish — not of which steps have been clicked through. Reaches
  // exactly 100% iff every REQUIRED_FOR_PUBLISH field is genuinely filled.
  const progressPercent = useMemo(() => {
    const filled = REQUIRED_FOR_PUBLISH.filter((field) => {
      const value = formData[field];
      return value !== null && value !== undefined && String(value).trim() !== "";
    }).length;
    return Math.round((filled / REQUIRED_FOR_PUBLISH.length) * 100);
  }, [formData]);

  return (
    <AppShell
      title="List Your Startup"
      subtitle="Showcase your startup to potential investors"
      actions={
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft size={16} />
          Back
        </Button>
      }
    >
      {/* Progress bar */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>
            Step {activeStep} of {STEPS.length}
          </span>
          <span className="flex items-center gap-2">
            {saveState === "saving" && (
              <span className="flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" /> Saving…
              </span>
            )}
            {saveState === "saved" && <span>Saved</span>}
            <span>{progressPercent}% complete</span>
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Step Indicator */}
      <div className="mb-8 flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;

          return (
            <button
              key={step.id}
              onClick={() => goToStep(step.id)}
              className={`
                flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300
                ${
                  isActive
                    ? "bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow-lg shadow-[var(--primary)]/25"
                    : "bg-white/50 text-[var(--text-muted)] border border-white/20"
                }
              `}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{step.label}</span>
              {idx < STEPS.length - 1 && <div className="ml-2 h-4 w-0.5 bg-white/20" />}
            </button>
          );
        })}
      </div>

      {/* Section 1: Basic Info */}
      {activeStep === 1 && (
        <GlassCard
          title="Basic Info"
          description="Tell investors what your startup is about"
          icon={Building2}
          className="mb-6"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <FormInput
                label="Startup Name"
                placeholder="e.g., Acme Inc"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
              {errors.name && <FieldError message={errors.name} />}
            </div>
            <div>
              <FormInput
                label="Tagline"
                placeholder="One-liner that captures your mission"
                value={formData.tagline}
                onChange={(e) => updateField("tagline", e.target.value)}
              />
              {errors.tagline && <FieldError message={errors.tagline} />}
            </div>
            <div className="md:col-span-2">
              <FormTextarea
                label="Description"
                placeholder="Describe your startup, what problem you solve, and your unique value proposition..."
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="min-h-[140px]"
              />
              {errors.description && <FieldError message={errors.description} />}
            </div>
          </div>
        </GlassCard>
      )}

      {/* Section 2: Industry, Stage & Country */}
      {activeStep === 2 && (
        <GlassCard
          title="Industry & Location"
          description="Categorize your startup for investors"
          icon={Building2}
          className="mb-6"
        >
          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-sm font-medium text-[var(--text-main)]">
                Primary Industry
              </label>
              <IndustrySelector
                options={meta.sectors}
                value={formData.sector}
                onChange={(sector) => updateField("sector", sector)}
              />
              {errors.sector && <FieldError message={errors.sector} />}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <FormSelect
                  label="Funding Stage"
                  options={meta.stages}
                  value={formData.stage}
                  onChange={(e) => updateField("stage", e.target.value)}
                />
                {errors.stage && <FieldError message={errors.stage} />}
              </div>
              <div>
                <CountrySelector
                  label="Registration Country"
                  options={meta.countries}
                  value={formData.registrationCountry}
                  onChange={(country) => updateField("registrationCountry", country)}
                  error={errors.registrationCountry}
                />
              </div>
              <FormInput
                label="City (optional)"
                placeholder="e.g., Mardan"
                value={formData.city}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </div>
          </div>
        </GlassCard>
      )}

      {/* Section 3: Funding */}
      {activeStep === 3 && (
        <GlassCard
          title="Funding Details"
          description="Set your funding goals"
          icon={DollarSign}
          className="mb-6"
        >
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <FormInput
                label="Funding Target"
                type="number"
                placeholder="1000000"
                value={formData.fundingTarget}
                onChange={(e) => updateField("fundingTarget", e.target.value)}
              />
              {errors.fundingTarget && <FieldError message={errors.fundingTarget} />}
            </div>
            <FormInput
              label="Funding Raised"
              type="number"
              placeholder="500000"
              value={formData.fundingRaised}
              onChange={(e) => updateField("fundingRaised", e.target.value)}
            />
            <FormSelect
              label="Currency"
              options={meta.currencies}
              value={formData.currency}
              onChange={(e) => updateField("currency", e.target.value)}
            />
          </div>

          {formData.fundingTarget && formData.fundingRaised && (
            <div className="mt-6">
              <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>Progress toward target</span>
                <span>
                  {Math.min(
                    100,
                    Math.round((Number(formData.fundingRaised) / Number(formData.fundingTarget)) * 100)
                  )}
                  %
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface)]">
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      (Number(formData.fundingRaised) / Number(formData.fundingTarget)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* Section 4: Media Uploads */}
      {activeStep === 4 && (
        <GlassCard
          title="Media & Documents"
          description="Visual assets for your startup profile"
          icon={Image}
          className="mb-6"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <FileUpload
              label="Startup Logo"
              accept="image/png,image/jpeg,image/webp"
              value={formData.logo}
              uploading={uploadingField === "logo"}
              onChange={(file, meta) => handleFileChange("logo", file, meta)}
              previewType="image"
            />
            <FileUpload
              label="Pitch Deck (PDF)"
              accept=".pdf"
              value={formData.pitchDeck}
              uploading={uploadingField === "pitchDeck"}
              onChange={(file, meta) => handleFileChange("pitchDeck", file, meta)}
              previewType="file"
            />
          </div>
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            Files upload immediately and are attached to your draft — no need to re-upload when you save.
          </p>
        </GlassCard>
      )}

      {/* Section 5: Traction */}
      {activeStep === 5 && (
        <GlassCard
          title="Traction & Metrics"
          description="Show your progress to investors"
          icon={TrendingUp}
          className="mb-8"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <FormInput
              label="Customers"
              type="number"
              placeholder="1000"
              value={formData.customersCount}
              onChange={(e) => updateField("customersCount", e.target.value)}
            />
            <FormInput
              label="Monthly Revenue (Optional)"
              type="number"
              placeholder="25000"
              value={formData.monthlyRevenue}
              onChange={(e) => updateField("monthlyRevenue", e.target.value)}
            />
            <div className="md:col-span-2">
              <FormTextarea
                label="Growth Notes"
                placeholder="Share your growth metrics, milestones, key achievements, or any other traction highlights..."
                value={formData.growthNotes}
                onChange={(e) => updateField("growthNotes", e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>
        </GlassCard>
      )}

      {/* Step navigation + footer actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBack} disabled={activeStep === 1} className="gap-2">
            <ArrowLeft size={16} />
            Previous
          </Button>
          {activeStep < STEPS.length ? (
            <Button onClick={handleNext} className="gap-2">
              Next
              <ArrowRight size={16} />
            </Button>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button variant="outline" onClick={handleSaveDraft} disabled={isSubmitting} className="gap-2">
            <Save size={18} />
            Save as Draft
          </Button>

          <Button
            onClick={handlePublish}
            disabled={isSubmitting}
            className="
              relative overflow-hidden bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]
              text-white shadow-lg shadow-[var(--primary)]/25 transition-all duration-300
              hover:translate-y-[-2px] hover:shadow-xl hover:shadow-[var(--primary)]/30
              disabled:translate-y-0 disabled:opacity-70
            "
          >
            {isSubmitting ? (
              <span className="animate-pulse">Publishing...</span>
            ) : (
              <>
                <Send size={18} />
                Publish Startup
              </>
            )}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function FieldError({ message }) {
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
      <AlertCircle size={12} />
      {message}
    </p>
  );
}