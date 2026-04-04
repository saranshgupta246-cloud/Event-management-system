import React, { useState, useCallback, useEffect } from "react";
import { X, Send, UserCircle } from "lucide-react";
import api from "../../services/api";

const TEMPLATES = [
  { id: "shortlist", name: "Shortlist", description: "Notify applicant they are shortlisted", subject: "You've been shortlisted!", templateKey: "shortlist" },
  { id: "interview", name: "Interview", description: "Invite to interview", subject: "Interview invitation", templateKey: "interview" },
  { id: "rejection", name: "Rejection", description: "Politely decline", subject: "Update on your application", templateKey: "rejection" },
  { id: "offer", name: "Offer", description: "Extend offer", subject: "Offer: Welcome to the team!", templateKey: "offer" },
];

const PLACEHOLDER_BODIES = {
  shortlist: `<p>Hi {{applicantName}},</p>
<p>Congratulations! You have been shortlisted for the role of <strong>{{roleName}}</strong> at <strong>{{clubName}}</strong>.</p>
<p>{{customMessage}}</p>
<p>We will be in touch with next steps.</p>
<p>Best regards,<br/>{{clubName}} Team</p>`,
  interview: `<p>Hi {{applicantName}},</p>
<p>You have been selected for an interview for the role of <strong>{{roleName}}</strong> at <strong>{{clubName}}</strong>.</p>
<p>{{customMessage}}</p>
<p>Please reply to this email to confirm your availability.</p>
<p>Best regards,<br/>{{clubName}} Team</p>`,
  rejection: `<p>Hi {{applicantName}},</p>
<p>Thank you for your interest in the role of <strong>{{roleName}}</strong> at <strong>{{clubName}}</strong>.</p>
<p>After careful consideration, we have decided to move forward with other candidates at this time.</p>
<p>{{customMessage}}</p>
<p>We encourage you to apply for future opportunities.</p>
<p>Best regards,<br/>{{clubName}} Team</p>`,
  offer: `<p>Hi {{applicantName}},</p>
<p>We are pleased to offer you the role of <strong>{{roleName}}</strong> at <strong>{{clubName}}</strong>!</p>
<p>{{customMessage}}</p>
<p>Please confirm your acceptance by replying to this email.</p>
<p>Congratulations and welcome aboard!</p>
<p>Best regards,<br/>{{clubName}} Team</p>`,
};

const PLACEHOLDERS = [
  { key: "applicantName", label: "Applicant Name" },
  { key: "roleName", label: "Role Name" },
  { key: "clubName", label: "Club Name" },
  { key: "customMessage", label: "Custom Message" },
];

function hashToHue(str) {
  let h = 0;
  for (let i = 0; i < (str || "").length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h % 360);
}

export default function EmailComposerModal({ applicationId, application: applicationProp, onClose, onSent }) {
  const [application, setApplication] = useState(applicationProp);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [previewTab, setPreviewTab] = useState("editor");

  useEffect(() => {
    if (applicationProp) {
      setApplication(applicationProp);
    } else if (applicationId) {
      api.get(`/api/applications/${applicationId}`).then((res) => {
        if (res.data?.success) setApplication(res.data.data);
      }).catch(() => {});
    }
  }, [applicationId, applicationProp]);

  const applicant = application?.applicantId || {};
  const applicantName = applicant.name || "Applicant";
  const applicantEmail = applicant.email || "";
  const clubName = application?.clubId?.name || "";
  const roleName = application?.driveId?.roleTitle || "";

  const replaceInBody = useCallback((text) => {
    return text
      .replace(/\{\{applicantName\}\}/g, applicantName)
      .replace(/\{\{roleName\}\}/g, roleName)
      .replace(/\{\{clubName\}\}/g, clubName)
      .replace(/\{\{customMessage\}\}/g, customMessage);
  }, [applicantName, roleName, clubName, customMessage]);

  const previewHtml = replaceInBody(body);

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setSubject(tpl.subject);
    setBody(PLACEHOLDER_BODIES[tpl.templateKey] || "");
  };

  const insertPlaceholder = (key) => {
    const tag = `{{${key}}}`;
    setBody((prev) => prev + tag);
  };

  const handleSend = async () => {
    if (!application?._id || !subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      await api.post(`/api/applications/${application._id}/email`, {
        subject: subject.trim(),
        body: body.trim(),
        templateUsed: selectedTemplate?.templateKey || "custom",
        customMessage: customMessage.trim(),
      });
      onSent?.();
      onClose?.();
    } catch {
      // show error in UI if needed
    } finally {
      setSending(false);
    }
  };

  const avatarBg = `hsl(${hashToHue(applicantName)}, 55%, 45%)`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" aria-hidden onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Send Email</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Left: Templates */}
          <div className="w-60 flex-shrink-0 border-r border-slate-200 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">Templates</p>
            <div className="space-y-2">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`w-full rounded-xl border p-3 text-left text-sm font-medium transition-colors ${
                    selectedTemplate?.id === tpl.id
                      ? "border-blue-400 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30"
                  }`}
                >
                  {tpl.name}
                  <p className="mt-0.5 text-xs font-normal text-slate-500">{tpl.description}</p>
                </button>
              ))}
            </div>
          </div>
          {/* Right: Composer */}
          <div className="flex min-w-0 flex-1 flex-col p-6">
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: avatarBg }}
              >
                {(applicantName || "A").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">{applicantName}</p>
                <p className="truncate text-xs text-slate-500">To: {applicantEmail || "â€”"}</p>
              </div>
            </div>
            <label htmlFor="email-composer-subject" className="mb-1 block text-xs font-medium text-slate-600">Subject</label>
            <input
              id="email-composer-subject"
              name="email-composer-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="email-composer-body" className="text-xs font-medium text-slate-600">Body</label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewTab("editor")}
                  className={`rounded px-2 py-1 text-xs font-medium ${previewTab === "editor" ? "bg-blue-100 text-blue-700" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("preview")}
                  className={`rounded px-2 py-1 text-xs font-medium ${previewTab === "preview" ? "bg-blue-100 text-blue-700" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  Preview
                </button>
              </div>
            </div>
            {previewTab === "editor" ? (
              <>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {PLACEHOLDERS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => insertPlaceholder(p.key)}
                      className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                      {`{{${p.key}}}`}
                    </button>
                  ))}
                </div>
                <textarea
                  id="email-composer-body"
                  name="email-composer-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Email body (HTML supported). Use placeholders above."
                  rows={12}
                  className="mb-4 w-full resize-y rounded-lg border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </>
            ) : (
              <div className="mb-4 min-h-[200px] rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="prose prose-sm max-w-none text-slate-800" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            )}
            <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-500">
                Sending to: <span className="font-medium text-slate-700">{applicantName}</span>
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !subject.trim() || !body.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? "Sending..." : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
