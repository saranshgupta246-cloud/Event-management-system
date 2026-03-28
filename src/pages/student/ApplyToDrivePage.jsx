import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/client";
import { ArrowLeft } from "lucide-react";
import { CATEGORY_COLORS } from "../../config/statusTokens";

export default function ApplyToDrivePage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const drive = state?.drive || null;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [answers, setAnswers] = useState([]);

  const missingDrive = !drive;

  if (missingDrive) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4">
        <p className="text-slate-600">Please open a drive from the recruitment page and click Apply.</p>
        <button
          type="button"
          onClick={() => navigate("/student/recruitment")}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Recruitment
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post(`/api/drives/${drive._id}/apply`, {
        answers,
        resumeUrl: resumeUrl || undefined,
        portfolioUrl: portfolioUrl || undefined,
      });
      navigate("/student/recruitment", { state: { applied: true } });
    } catch (err) {
      setError(err.response?.data?.message || "Application failed");
    } finally {
      setSubmitting(false);
    }
  };

  const clubName = drive?.clubId?.name || "Club";
  const category = drive?.clubId?.category || "Technical";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 px-4 py-6 md:px-6">
          <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => navigate("/student/recruitment")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Recruitment
        </button>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <span
              className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: `${CATEGORY_COLORS[category] || CATEGORY_COLORS.Technical}1A`,
                color: CATEGORY_COLORS[category] || CATEGORY_COLORS.Technical,
              }}
            >
              {category}
            </span>
            <h1 className="mt-2 text-xl font-bold text-slate-900">{drive.roleTitle}</h1>
            <p className="text-sm text-slate-500">{clubName}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor={drive?._id ? `apply-drive-${drive._id}-resume` : "apply-drive-resume"} className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">
                Resume URL
              </label>
              <input
                id={drive?._id ? `apply-drive-${drive._id}-resume` : "apply-drive-resume"}
                name={drive?._id ? `apply-drive-${drive._id}-resume` : "apply-drive-resume"}
                type="url"
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor={drive?._id ? `apply-drive-${drive._id}-portfolio` : "apply-drive-portfolio"} className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-600">
                Portfolio / GitHub URL
              </label>
              <input
                id={drive?._id ? `apply-drive-${drive._id}-portfolio` : "apply-drive-portfolio"}
                name={drive?._id ? `apply-drive-${drive._id}-portfolio` : "apply-drive-portfolio"}
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-[0_1px_2px_rgba(37,99,235,0.3)] hover:bg-primary-700 disabled:opacity-70"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/student/recruitment")}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
