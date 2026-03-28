import React, { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, ChevronRight, Loader2, Upload } from "lucide-react";
import api from "../../api/client";

function StepIndicator({ step }) {
  const steps = [
    { id: 1, label: "Upload" },
    { id: 2, label: "Position Name" },
    { id: 3, label: "Preview & Save" },
  ];

  return (
    <div className="mb-8 flex items-center justify-between gap-4">
      {steps.map((s, idx) => {
        const isActive = step === s.id;
        const isDone = step > s.id;
        return (
          <div key={s.id} className="flex flex-1 items-center">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  isDone
                    ? "bg-emerald-500 text-white"
                    : isActive
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {isDone ? <Check className="h-4 w-4" /> : s.id}
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-xs font-semibold ${
                    isActive
                      ? "text-blue-700"
                      : isDone
                      ? "text-emerald-600"
                      : "text-slate-500"
                  }`}
                >
                  Step {s.id}
                </span>
                <span className="text-sm font-medium text-slate-900">
                  {s.label}
                </span>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <div className="mx-3 h-px flex-1 bg-slate-200" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function CertificateDesigner() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [namePosition, setNamePosition] = useState({ x: 50, y: 55 });
  const [nameStyle, setNameStyle] = useState({
    fontSize: 64,
    fontFamily: "serif",
    color: "#1a1a2e",
    align: "center",
    bold: false,
  });
  const [showQR, setShowQR] = useState(true);
  const [showVerificationId, setShowVerificationId] = useState(true);
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("custom");
  const [apiPreview, setApiPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [testName, setTestName] = useState("Rahul Sharma");
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError("");

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(selected);
  };

  const handleImageClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setNamePosition({
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
    });
  };

  const handleColorPreset = (color) => {
    setNameStyle((prev) => ({ ...prev, color }));
  };

  const handleFontFamily = (fontFamily) => {
    setNameStyle((prev) => ({ ...prev, fontFamily }));
  };

  const handleAlign = (align) => {
    setNameStyle((prev) => ({ ...prev, align }));
  };

  const canGoToStep2 = !!file;
  const canGoToStep3 = !!file && !!namePosition;
  const canSave = !!file && !!templateName && !saving;

  const handleNextFromStep1 = () => {
    if (!file) {
      setError("Please upload a certificate image before continuing.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    if (!file) return;
    setStep(3);
  };

  const buildPreview = useCallback(async () => {
    try {
      setLoadingPreview(true);
      setError("");
      if (!apiPreview?.templateId) {
        setLoadingPreview(false);
        return;
      }
      const res = await api.get("/api/certificates/templates/preview", {
        params: {
          templateId: apiPreview.templateId,
          testName,
        },
      });
      const previewData = res.data?.data?.preview;
      if (previewData) {
        setApiPreview((prev) => ({
          ...(prev || {}),
          image: previewData,
        }));
      }
    } catch (e) {
      setError(e.message || "Failed to generate preview");
    } finally {
      setLoadingPreview(false);
    }
  }, [apiPreview, testName]);

  const handleSave = async () => {
    if (!file) return;
    if (!templateName.trim()) {
      setError("Template name is required.");
      setStep(3);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("name", templateName.trim());
      if (description) formData.append("description", description);
      formData.append("category", category);
      formData.append("namePosition", JSON.stringify(namePosition));
      formData.append("nameStyle", JSON.stringify(nameStyle));
      formData.append("showQR", String(showQR));
      formData.append("showVerificationId", String(showVerificationId));

      const res = await api.post(
        "/api/certificates/templates/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const saved = res.data?.data;
      if (saved?._id) {
        setApiPreview({ templateId: saved._id });
      }

      // eslint-disable-next-line no-alert
      alert("Template saved! ✅");
      navigate("/admin/certificates");
    } catch (e) {
      setError(e.message || "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  const renderStep1 = () => (
    <div>
      <div
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center transition hover:border-blue-400 hover:bg-blue-50/30"
        onClick={() => document.getElementById("certificate-upload-input")?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            document.getElementById("certificate-upload-input")?.click();
          }
        }}
      >
        {imagePreview ? (
          <>
            <div className="max-h-[420px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <img
                src={imagePreview}
                alt={file?.name || "Certificate"}
                className="mx-auto h-full w-full max-h-[420px] object-contain"
              />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-800">
              {file?.name}{" "}
              {file?.size
                ? `• ${(file.size / (1024 * 1024)).toFixed(2)} MB`
                : null}
            </p>
            <button
              type="button"
              className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Change Image
            </button>
          </>
        ) : (
          <>
            <Upload className="h-12 w-12 text-slate-300" />
            <h2 className="mt-4 text-xl font-semibold text-slate-700">
              Upload your certificate design
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              PNG or JPG • Max 10MB • A4 portrait recommended
            </p>
            <button
              type="button"
              className="mt-6 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Browse Files
            </button>
          </>
        )}
      </div>

      <input
        id="certificate-upload-input"
        name="certificate-upload-input"
        type="file"
        accept=".png,.jpg,.jpeg"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-slate-700">
        <p className="font-semibold">💡 Pro Tip: Design in Canva for free!</p>
        <p className="mt-1 text-xs text-slate-600">
          Create an A4 portrait certificate in Canva, Word, or Photoshop, export as
          high-resolution PNG, then upload it here. Visit{" "}
          <a
            href="https://www.canva.com"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-blue-600 underline underline-offset-2"
          >
            canva.com
          </a>{" "}
          to get started.
        </p>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleNextFromStep1}
          disabled={!canGoToStep2}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm ${
            canGoToStep2
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "cursor-not-allowed bg-slate-200 text-slate-500"
          }`}
        >
          Next: Position the Name
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="grid gap-6 md:grid-cols-5">
      <div className="md:col-span-3">
        <p className="mb-3 text-sm text-slate-500">
          Click anywhere on the certificate to mark where the student name should
          appear.
        </p>
        <div className="relative flex max-h-[600px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          {imagePreview ? (
            <div className="relative max-h-[600px] w-full">
              <img
                src={imagePreview}
                alt="Certificate preview"
                className="h-full w-full max-h-[600px] cursor-crosshair object-contain"
                onClick={handleImageClick}
              />
              {namePosition && (
                <div
                  className="pointer-events-none absolute"
                  style={{
                    top: `${namePosition.y}%`,
                    left: `${namePosition.x}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="rounded border border-dashed border-blue-400 bg-white/70 px-4 py-1 text-sm font-semibold text-slate-800 shadow-sm">
                    Rahul Sharma
                  </div>
                  <div className="absolute left-1/2 top-full mt-1 h-2 w-2 -translate-x-1/2 rounded-full bg-blue-500" />
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">
              Please upload a certificate image in Step 1 first.
            </div>
          )}
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Name Styling</h3>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {[
              {
                id: "serif",
                label: "Serif",
                desc: "Classic, formal",
                className: "font-serif",
              },
              {
                id: "sans-serif",
                label: "Sans-serif",
                desc: "Modern, clean",
                className: "font-sans",
              },
              {
                id: "script",
                label: "Script",
                desc: "Elegant, cursive",
                className: "font-serif italic",
              },
            ].map((opt) => {
              const active = nameStyle.fontFamily === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleFontFamily(opt.id)}
                  className={`flex flex-col rounded-xl border px-3 py-2 text-left text-xs ${
                    active
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <span className="text-[11px] font-semibold text-slate-800">
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-slate-500">{opt.desc}</span>
                  <span
                    className={`mt-1 truncate text-sm text-slate-800 ${opt.className}`}
                  >
                    Rahul
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-slate-700">Font Size</p>
              <p className="text-xs text-slate-500">{nameStyle.fontSize}px</p>
            </div>
            <input
              id="certificate-designer-name-font-size"
              name="certificate-designer-name-font-size"
              type="range"
              min={24}
              max={120}
              value={nameStyle.fontSize}
              onChange={(e) =>
                setNameStyle((prev) => ({
                  ...prev,
                  fontSize: Number(e.target.value) || 64,
                }))
              }
              className="mt-2 w-full"
            />
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium text-slate-700">Text Color</p>
            <div className="mt-2 flex items-center gap-3">
              <input
                id="certificate-designer-name-color"
                name="certificate-designer-name-color"
                type="color"
                value={nameStyle.color}
                onChange={(e) =>
                  setNameStyle((prev) => ({ ...prev, color: e.target.value }))
                }
                className="h-9 w-10 cursor-pointer rounded border border-slate-200 bg-white"
              />
              <div className="flex flex-wrap gap-2">
                {[
                  "#1a1a2e",
                  "#8B6914",
                  "#1a237e",
                  "#2d6a4f",
                  "#000000",
                  "#ffffff",
                ].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleColorPreset(c)}
                    className="h-6 w-6 rounded-full border border-slate-200"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {["left", "center", "right"].map((a) => {
              const active = nameStyle.align === a;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => handleAlign(a)}
                  className={`flex-1 rounded-md border px-2 py-1 text-[11px] font-semibold ${
                    active
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {a[0].toUpperCase() + a.slice(1)}
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-700">
              <span>Show QR Code</span>
              <button
                type="button"
                onClick={() => setShowQR((v) => !v)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full ${
                  showQR ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    showQR ? "translate-x-4" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-700">
              <span>Show Verification ID</span>
              <button
                type="button"
                onClick={() => setShowVerificationId((v) => !v)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full ${
                  showVerificationId ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    showVerificationId ? "translate-x-4" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          <p className="mt-4 text-[11px] text-slate-500">
            Name position: X:{" "}
            <span className="font-mono">
              {namePosition.x.toFixed(1)}
              %
            </span>{" "}
            Y:{" "}
            <span className="font-mono">
              {namePosition.y.toFixed(1)}
              %
            </span>
          </p>

          <div className="mt-4 flex justify-between gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleNextFromStep2}
              disabled={!canGoToStep3}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm ${
                canGoToStep3
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "cursor-not-allowed bg-slate-200 text-slate-500"
              }`}
            >
              Next: Preview &amp; Save
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="grid gap-6 md:grid-cols-5">
      <div className="md:col-span-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Final Preview
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          This is how the certificate will look when issued.
        </p>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-4">
            <div className="relative flex max-h-[520px] items-center justify-center overflow-hidden rounded-xl bg-slate-100">
              {apiPreview?.image ? (
                <img
                  src={apiPreview.image}
                  alt="Preview"
                  className="h-full w-full max-h-[520px] object-contain"
                />
              ) : imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-full w-full max-h-[520px] object-contain"
                />
              ) : (
                <div className="p-8 text-center text-xs text-slate-500">
                  Upload an image in Step 1 to see the preview.
                </div>
              )}
              {loadingPreview && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <label htmlFor="certificate-designer-test-name">Test with name:</label>
                <input
                  id="certificate-designer-test-name"
                  name="certificate-designer-test-name"
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                  placeholder="Rahul Sharma"
                />
              </div>
              <button
                type="button"
                onClick={buildPreview}
                disabled={!apiPreview?.templateId || loadingPreview}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingPreview && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Update Preview
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="md:col-span-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">
            Template Details
          </h3>

          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="certificate-designer-template-name" className="block text-xs font-semibold text-slate-700">
                Template Name *
              </label>
              <input
                id="certificate-designer-template-name"
                name="certificate-designer-template-name"
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                placeholder="Gold Standard 2024"
              />
            </div>

            <div>
              <label htmlFor="certificate-designer-template-description" className="block text-xs font-semibold text-slate-700">
                Description
              </label>
              <textarea
                id="certificate-designer-template-description"
                name="certificate-designer-template-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                placeholder="Optional description for this template"
              />
            </div>

            <div>
              <label htmlFor="certificate-designer-template-category" className="block text-xs font-semibold text-slate-700">
                Category
              </label>
              <select
                id="certificate-designer-template-category"
                name="certificate-designer-template-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
              >
                <option value="gold">Gold</option>
                <option value="navy">Navy</option>
                <option value="elegant">Elegant</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">Summary</p>
            <ul className="mt-2 space-y-1">
              <li>✅ Certificate image uploaded</li>
              <li>
                ✅ Name position: X:
                <span className="font-mono">
                  {" "}
                  {namePosition.x.toFixed(1)}%
                </span>{" "}
                Y:
                <span className="font-mono">
                  {" "}
                  {namePosition.y.toFixed(1)}%
                </span>
              </li>
              <li>
                ✅ Font: {nameStyle.fontFamily} {nameStyle.fontSize}px
              </li>
              <li>✅ QR code: {showQR ? "enabled" : "disabled"}</li>
              <li>
                ✅ Verification ID: {showVerificationId ? "enabled" : "disabled"}
              </li>
            </ul>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm ${
                canSave
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "cursor-not-allowed bg-slate-200 text-slate-500"
              }`}
            >
              {saving && (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              )}
              💾 Save Template
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => navigate("/admin/certificates")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <span>←</span>
              <span>Back to Certificates</span>
            </button>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              Certificate Template Designer
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Design your certificate in Canva, Word, or Photoshop — then upload it
              here to mark where the student name and QR code should appear.
            </p>
          </div>
        </header>

        <StepIndicator step={step} />

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </div>
  );
}

