import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../api/client";
import { useTheme } from "../../context/ThemeContext";

const FIELDS = [
  { key: "name", label: "Student name", color: "#6366f1", yKey: "nameY", required: true },
  {
    key: "position",
    label: "Position / rank",
    color: "#f59e0b",
    yKey: "positionY",
    required: false,
  },
  { key: "rollNo", label: "Roll number", color: "#10b981", yKey: "rollNoY", required: false },
];

/** A4 landscape: page height in PDF points (matches backend when template is landscape). */
const PDF_HEIGHT_PTS = 595;
const PREVIEW_WIDTH = 850;
const PREVIEW_HEIGHT = 602;

export default function CertificateEditorPage() {
  const { dark } = useTheme();
  const t = useMemo(
    () => ({
      pageBg: dark ? "#0d1117" : "#f8fafc",
      topbar: dark ? "#0d1117" : "#ffffff",
      topbarBorder: dark ? "#1e2d42" : "#e2e8f0",
      panel: dark ? "#0d1117" : "#ffffff",
      panelBorder: dark ? "#1e2d42" : "#e2e8f0",
      canvas: dark ? "#1e2d42" : "#e8edf2",
      fieldItem: dark ? "rgba(255,255,255,0.04)" : "#f1f5f9",
      fieldItemActive: dark ? "rgba(99,102,241,0.15)" : "#eef2ff",
      fieldItemActiveBorder: dark ? "rgba(99,102,241,0.4)" : "#a5b4fc",
      fieldLabel: dark ? "#ddd" : "#1e293b",
      fieldCoords: dark ? "#555" : "#94a3b8",
      panelTitle: dark ? "#555" : "#94a3b8",
      inputBg: dark ? "rgba(255,255,255,0.06)" : "#f8fafc",
      inputBorder: dark ? "rgba(255,255,255,0.1)" : "#e2e8f0",
      inputText: dark ? "#fff" : "#1e293b",
      instructionBg: dark ? "rgba(99,102,241,0.1)" : "#eef2ff",
      instructionBorder: dark ? "rgba(99,102,241,0.2)" : "#c7d2fe",
      instructionText: dark ? "#a5b4fc" : "#4f46e5",
      btnGhost: dark ? "rgba(255,255,255,0.08)" : "#f1f5f9",
      btnGhostText: dark ? "#ccc" : "#475569",
      noPdfBg: dark ? "rgba(255,255,255,0.03)" : "#f1f5f9",
      noPdfBorder: dark ? "rgba(255,255,255,0.08)" : "#e2e8f0",
      noPdfText: dark ? "#444" : "#94a3b8",
      text: dark ? "#fff" : "#1e293b",
    }),
    [dark]
  );

  const { eventId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isLeaderContext = location.pathname.startsWith("/leader");
  const [event, setEvent] = useState(null);
  const [templateType, setTemplateType] = useState("participation");
  const [selectedField, setSelectedField] = useState("name");
  const [pins, setPins] = useState({ nameY: 400, positionY: 450, rollNoY: 470 });
  const [fontSize, setFontSize] = useState(28);
  const [positionFontSize, setPositionFontSize] = useState(20);
  const [rollNoEnabled, setRollNoEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => {
    if (!eventId) return;
    const applyCoords = (c) => {
      if (!c) return;
      setPins({
        nameY: c.nameY ?? 400,
        positionY: c.positionY ?? 450,
        rollNoY: c.rollNoY ?? 470,
      });
      setFontSize(c.fontSize ?? 28);
      setPositionFontSize(c.positionFontSize ?? 20);
      setRollNoEnabled(c.rollNoEnabled ?? false);
    };

    if (isLeaderContext) {
      api.get(`/api/certificates/events/${eventId}/eligible`).then((res) => {
        const data = res.data?.data ?? {};
        setEvent({
          title: data.eventTitle,
          meritTemplateUrl: data.meritTemplateUrl,
          participationTemplateUrl: data.participationTemplateUrl,
        });
        applyCoords(data.certificateCoords);
      });
    } else {
      api.get(`/api/admin/events/${eventId}`).then((res) => {
        const ev = res.data?.data;
        setEvent(ev);
        applyCoords(ev?.certificateCoords);
      });
    }
  }, [eventId, isLeaderContext]);

  const templateUrl =
    templateType === "merit" ? event?.meritTemplateUrl : event?.participationTemplateUrl;

  const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(
    /\/api\/?$/,
    ""
  );

  function handlePreviewClick(e) {
    const el = previewRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const previewHeight = rect.height;
    // A4 landscape preview: map click Y to PDF points (short side = 595pt)
    const rawY = Math.round((relativeY / previewHeight) * PDF_HEIGHT_PTS);
    const pdfY = Math.max(0, Math.min(PDF_HEIGHT_PTS, rawY));
    const field = FIELDS.find((f) => f.key === selectedField);
    if (!field) return;
    setPins((prev) => ({ ...prev, [field.yKey]: pdfY }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const saveUrl = isLeaderContext
        ? `/api/certificates/events/${eventId}/certificate-coords`
        : `/api/admin/events/${eventId}/certificate-coords`;
      await api.put(saveUrl, {
        nameY: pins.nameY,
        positionY: pins.positionY,
        rollNoY: pins.rollNoY,
        rollNoEnabled,
        fontSize,
        positionFontSize,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const activeField = FIELDS.find((f) => f.key === selectedField);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: t.pageBg,
        color: t.text,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          background: t.topbar,
          borderBottom: `0.5px solid ${t.topbarBorder}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: "none",
              border: "none",
              color: t.fieldCoords,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
          <span style={{ fontSize: 14, fontWeight: 500, color: t.text }}>
            Certificate text placement — {event?.title || "…"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: t.btnGhost,
              border: "none",
              color: t.btnGhostText,
              fontSize: 12,
              padding: "6px 14px",
              borderRadius: 7,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              background: "#6366f1",
              border: "none",
              color: "#fff",
              fontSize: 12,
              padding: "6px 14px",
              borderRadius: 7,
              cursor: "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saved ? "Saved!" : saving ? "Saving…" : "Save placement"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div
          style={{
            width: 220,
            flexShrink: 0,
            background: t.panel,
            borderRight: `0.5px solid ${t.panelBorder}`,
            padding: 16,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: t.panelTitle,
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Template
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["participation", "merit"].map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => setTemplateType(tpl)}
                  style={{
                    flex: 1,
                    padding: "5px 0",
                    borderRadius: 6,
                    border: "none",
                    fontSize: 11,
                    cursor: "pointer",
                    background: templateType === tpl ? "#6366f1" : t.btnGhost,
                    color: templateType === tpl ? "#fff" : t.btnGhostText,
                  }}
                >
                  {tpl.charAt(0).toUpperCase() + tpl.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 11,
                color: t.panelTitle,
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Select field to place
            </div>
            {FIELDS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setSelectedField(f.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 7,
                  marginBottom: 5,
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                  background: selectedField === f.key ? t.fieldItemActive : t.fieldItem,
                  border: `0.5px solid ${
                    selectedField === f.key ? t.fieldItemActiveBorder : "transparent"
                  }`,
                  color: t.text,
                }}
              >
                <div
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 2,
                    background: f.color,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: t.fieldLabel }}>{f.label}</div>
                  <div style={{ fontSize: 10, color: t.fieldCoords, fontFamily: "monospace" }}>
                    y: {pins[f.yKey]} pt
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div>
            <div
              style={{
                fontSize: 11,
                color: t.panelTitle,
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Options
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={rollNoEnabled}
                onChange={(e) => setRollNoEnabled(e.target.checked)}
              />
              <span style={{ fontSize: 12, color: t.fieldLabel }}>Show roll number</span>
            </label>
          </div>

          <div>
            <div
              style={{
                fontSize: 11,
                color: t.panelTitle,
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              Font sizes
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: t.panelTitle, marginBottom: 4 }}>Name (pt)</div>
              <input
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                style={{
                  width: "100%",
                  background: t.inputBg,
                  border: `0.5px solid ${t.inputBorder}`,
                  borderRadius: 5,
                  padding: "4px 8px",
                  color: t.inputText,
                  fontSize: 12,
                  fontFamily: "monospace",
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: t.panelTitle, marginBottom: 4 }}>Position (pt)</div>
              <input
                type="number"
                value={positionFontSize}
                onChange={(e) => setPositionFontSize(Number(e.target.value))}
                style={{
                  width: "100%",
                  background: t.inputBg,
                  border: `0.5px solid ${t.inputBorder}`,
                  borderRadius: 5,
                  padding: "4px 8px",
                  color: t.inputText,
                  fontSize: 12,
                  fontFamily: "monospace",
                }}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: "auto",
              padding: "10px",
              background: t.instructionBg,
              borderRadius: 8,
              border: `0.5px solid ${t.instructionBorder}`,
            }}
          >
            <div style={{ fontSize: 11, color: t.instructionText, lineHeight: 1.6 }}>
              1. Select a field above
              <br />
              2. Click on the certificate where that text should appear
              <br />
              3. Repeat for each field
              <br />
              4. Save when done
            </div>
          </div>
        </div>

        {/* Canvas area — takes all remaining space */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            overflow: "auto",
            padding: "20px 24px",
            gap: 10,
            background: t.canvas,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: t.instructionText,
              background: t.instructionBg,
              border: `0.5px solid ${t.instructionBorder}`,
              borderRadius: 6,
              padding: "6px 14px",
              flexShrink: 0,
            }}
          >
            {activeField
              ? `Click anywhere on the certificate to place: ${activeField.label}`
              : "Select a field from the left panel first"}
          </div>

          {templateUrl ? (
            <div
              ref={previewRef}
              onClick={handlePreviewClick}
              role="presentation"
              style={{
                position: "relative",
                width: PREVIEW_WIDTH,
                height: PREVIEW_HEIGHT,
                cursor: "crosshair",
                flexShrink: 0,
                borderRadius: 4,
                overflow: "hidden",
                boxShadow: dark
                  ? "0 8px 32px rgba(0,0,0,0.5)"
                  : "0 8px 24px rgba(15,23,42,0.12)",
              }}
            >
              <object
                data={`${apiBase}${templateUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                type="application/pdf"
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  display: "block",
                  pointerEvents: "none",
                }}
              >
                <div style={{ padding: 20, color: t.noPdfText, fontSize: 12 }}>
                  PDF preview unavailable. Placement still works — click to set positions.
                </div>
              </object>

              {FIELDS.map((f) => {
                if (f.key === "rollNo" && !rollNoEnabled) return null;
                const pixelY = (pins[f.yKey] / PDF_HEIGHT_PTS) * PREVIEW_HEIGHT;
                const isSelected = selectedField === f.key;
                return (
                  <div
                    key={f.key}
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: pixelY,
                      height: isSelected ? 2 : 1,
                      background: f.color,
                      opacity: isSelected ? 1 : 0.5,
                      pointerEvents: "none",
                      zIndex: 10,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        right: 8,
                        top: -11,
                        background: f.color,
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "2px 7px",
                        borderRadius: 4,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {f.label}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: -4,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: f.color,
                        transform: "translateX(-50%)",
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                width: PREVIEW_WIDTH,
                height: PREVIEW_HEIGHT,
                background: t.noPdfBg,
                border: `0.5px dashed ${t.noPdfBorder}`,
                borderRadius: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: 13, color: t.noPdfText }}>
                No {templateType} template uploaded
              </div>
              <div style={{ fontSize: 11, color: t.noPdfText }}>Upload a PDF first, then return here</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
