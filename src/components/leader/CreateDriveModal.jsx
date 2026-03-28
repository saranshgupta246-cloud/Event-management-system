import React, { useState, useCallback, useEffect } from "react";
import {
  X,
  Calendar,
  Plus,
  Minus,
  GripVertical,
  AlignLeft,
  AlignJustify,
  CheckSquare,
  Link as LinkIcon,
  Rocket,
  FileQuestion,
  Trash2,
} from "lucide-react";
import { DndContext, closestCenter, useDraggable, useDroppable } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import api from "../../api/client";

const MODAL_STEPS = ["Basic Info", "Form Builder", "Review & Publish"];
const QUESTION_TYPES = [
  { id: "text", label: "Short Text", icon: AlignLeft, desc: "Single line" },
  { id: "textarea", label: "Long Text", icon: AlignJustify, desc: "Paragraph" },
  { id: "mcq", label: "Multiple Choice", icon: CheckSquare, desc: "One answer" },
  { id: "checkbox", label: "Checkboxes", icon: CheckSquare, desc: "Multiple answers" },
  { id: "url", label: "URL", icon: LinkIcon, desc: "Link" },
];

const INPUT_STYLE =
  "w-full rounded-lg border border-[#E2E8F0] px-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-[0_0_0_3px] focus:ring-[rgba(59,130,246,0.1)]";

function formatDateTime(d) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toDatetimeLocal(d) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function generateQuestionId() {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function SortableQuestionCard({ question, index, onUpdate, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.questionId });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const typeMeta = QUESTION_TYPES.find((t) => t.id === question.type) || QUESTION_TYPES[0];
  const Icon = typeMeta.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-3 flex gap-3 rounded-xl border border-slate-200 bg-white p-4 ${isDragging ? "opacity-50 shadow-lg" : ""}`}
    >
      <div
        className="flex cursor-grab items-center text-slate-300 hover:text-slate-500 active:cursor-grabbing"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              question.type === "mcq" || question.type === "checkbox" ? "bg-purple-50 text-purple-700" : question.type === "url" ? "bg-slate-100 text-slate-600" : "bg-blue-50 text-blue-700"
            }`}
          >
            <Icon className="h-3 w-3" /> {typeMeta.label}
          </span>
          <div className="ml-auto flex items-center gap-2 text-xs">
            <span className="text-slate-500">Required</span>
            <button
              type="button"
              role="switch"
              onClick={() => onUpdate({ ...question, required: !question.required })}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
                question.required ? "bg-green-500" : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  question.required ? "translate-x-4" : "translate-x-0.5"
                } mt-0.5`}
              />
            </button>
          </div>
          <button type="button" onClick={() => onRemove()} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        <input
          id={`create-drive-q-label-${question.questionId}`}
          name={`create-drive-q-label-${question.questionId}`}
          type="text"
          value={question.label || ""}
          onChange={(e) => onUpdate({ ...question, label: e.target.value })}
          placeholder="Enter your question..."
          className="w-full border-0 border-b border-slate-200 bg-transparent pb-1 text-sm font-medium focus:border-blue-500 focus:outline-none"
        />
        {(question.type === "mcq" || question.type === "checkbox") && (
          <div className="mt-3 space-y-2">
            {(question.options || []).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  id={`create-drive-q-opt-${question.questionId}-${i}`}
                  name={`create-drive-q-opt-${question.questionId}-${i}`}
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const next = [...(question.options || [])];
                    next[i] = e.target.value;
                    onUpdate({ ...question, options: next });
                  }}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = (question.options || []).filter((_, j) => j !== i);
                    onUpdate({ ...question, options: next });
                  }}
                  className="text-slate-400 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onUpdate({ ...question, options: [...(question.options || []), ""] })}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              + Add Option
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreateDriveModal({ isOpen, onClose, onSuccess, clubId, initialDrive }) {
  const isEdit = !!initialDrive?._id;
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [maxApplicants, setMaxApplicants] = useState(50);
  const [unlimited, setUnlimited] = useState(false);
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [questions, setQuestions] = useState([]);
  const [addQuestionOpen, setAddQuestionOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (initialDrive) {
      setTitle(initialDrive.title || "");
      setRoleTitle(initialDrive.roleTitle || "");
      setDescription(initialDrive.description || "");
      setDeadline(toDatetimeLocal(initialDrive.deadline) || "");
      setMaxApplicants(initialDrive.maxApplicants ?? 50);
      setUnlimited(initialDrive.maxApplicants == null);
      setSkills(initialDrive.requiredSkills || []);
      setQuestions(
        (initialDrive.customQuestions || []).map((q) => ({
          questionId: q.questionId || generateQuestionId(),
          label: q.label || "",
          type: q.type || "text",
          options: q.options || [],
          required: !!q.required,
          placeholder: q.placeholder || "",
        }))
      );
    } else {
      setStep(1);
      setTitle("");
      setRoleTitle("");
      setDescription("");
      setDeadline("");
      setMaxApplicants(50);
      setUnlimited(false);
      setSkills([]);
      setSkillInput("");
      setQuestions([]);
    }
  }, [initialDrive, isOpen]);

  const addSkill = () => {
    const v = skillInput.trim();
    if (v && !skills.includes(v)) {
      setSkills((prev) => [...prev, v]);
      setSkillInput("");
    }
  };

  const removeSkill = (idx) => {
    setSkills((prev) => prev.filter((_, i) => i !== idx));
  };

  const addQuestion = (type) => {
    setQuestions((prev) => [
      ...prev,
      {
        questionId: generateQuestionId(),
        label: "",
        type,
        options: type === "mcq" || type === "checkbox" ? [""] : [],
        required: false,
      },
    ]);
    setAddQuestionOpen(false);
  };

  const updateQuestion = (index, updated) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? updated : q)));
  };

  const removeQuestion = (index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.questionId === active.id);
      const newIndex = questions.findIndex((q) => q.questionId === over.id);
      if (oldIndex >= 0 && newIndex >= 0) {
        setQuestions((prev) => arrayMove(prev, oldIndex, newIndex));
      }
    }
  };

  const validateStep1 = () => {
    return title.trim() && roleTitle.trim() && description.trim() && deadline;
  };

  const submitDraft = async () => {
    if (!validateStep1()) return;
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        roleTitle: roleTitle.trim(),
        description: description.trim(),
        deadline: new Date(deadline).toISOString(),
        requiredSkills: skills,
        customQuestions: questions.map((q) => ({
          questionId: q.questionId,
          label: q.label || "",
          type: q.type,
          options: q.options || [],
          required: q.required,
          placeholder: q.placeholder || undefined,
        })),
        maxApplicants: unlimited ? null : maxApplicants,
      };
      if (isEdit) {
        await api.patch(`/api/clubs/${clubId}/drives/${initialDrive._id}`, payload);
        setToast("Changes saved.");
      } else {
        await api.post(`/api/clubs/${clubId}/drives`, payload);
        setToast("Drive saved as draft.");
      }
      setTimeout(() => { setToast(null); onSuccess(); }, 1500);
    } catch (err) {
      setToast(err.response?.data?.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const submitPublish = async () => {
    if (!validateStep1()) return;
    setSubmitting(true);
    try {
      if (isEdit) {
        await api.patch(`/api/clubs/${clubId}/drives/${initialDrive._id}`, {
          title: title.trim(),
          roleTitle: roleTitle.trim(),
          description: description.trim(),
          deadline: new Date(deadline).toISOString(),
          requiredSkills: skills,
          customQuestions: questions.map((q) => ({
            questionId: q.questionId,
            label: q.label || "",
            type: q.type,
            options: q.options || [],
            required: q.required,
            placeholder: q.placeholder || undefined,
          })),
          maxApplicants: unlimited ? null : maxApplicants,
          status: "open",
        });
      } else {
        const res = await api.post(`/api/clubs/${clubId}/drives`, {
          title: title.trim(),
          roleTitle: roleTitle.trim(),
          description: description.trim(),
          deadline: new Date(deadline).toISOString(),
          requiredSkills: skills,
          customQuestions: questions.map((q) => ({
            questionId: q.questionId,
            label: q.label || "",
            type: q.type,
            options: q.options || [],
            required: q.required,
            placeholder: q.placeholder || undefined,
          })),
          maxApplicants: unlimited ? null : maxApplicants,
        });
        await api.patch(`/api/clubs/${clubId}/drives/${res.data.data._id}`, { status: "open" });
      }
      setToast("Drive published! Students can now apply.");
      setTimeout(() => { setToast(null); onSuccess(); }, 1500);
    } catch (err) {
      setToast(err.response?.data?.message || "Failed to publish");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
        style={{ animation: "applyOverlayIn 150ms ease-out forwards" }}
        onClick={onClose}
        aria-hidden
      />
      <div
        data-create-drive-modal
        className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-[0_25px_50px_rgba(0,0,0,0.15)] md:max-h-[90vh]"
        style={{ animation: "applyModalSlide 300ms ease-out forwards" }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes applyOverlayIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes applyModalSlide { from { opacity: 0; transform: translate(-50%, -50%) translateY(20px); } to { opacity: 1; transform: translate(-50%, -50%) translateY(0); } }
          @media (max-width: 767px) {
            [data-create-drive-modal] { left: 0; top: 0; right: 0; bottom: 0; width: 100%; max-height: 100vh; transform: none; border-radius: 0; }
          }
        `}</style>

        <div className="flex-shrink-0 border-b border-slate-100 px-6 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {MODAL_STEPS.map((label, i) => (
                <span
                  key={label}
                  className={`text-xs font-medium ${step === i + 1 ? "text-blue-600" : "text-slate-400"}`}
                >
                  {i + 1}. {label}
                </span>
              ))}
            </div>
            <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label htmlFor="create-drive-title" className="mb-1 block text-sm font-medium text-slate-700">Drive Title</label>
                <input
                  id="create-drive-title"
                  name="create-drive-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Fall 2024 Developer Recruitment"
                  className={INPUT_STYLE}
                />
              </div>
              <div>
                <label htmlFor="create-drive-role-title" className="mb-1 block text-sm font-medium text-slate-700">Role Title</label>
                <input
                  id="create-drive-role-title"
                  name="create-drive-role-title"
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Full-Stack Developer"
                  className={INPUT_STYLE}
                />
              </div>
              <div>
                <label htmlFor="create-drive-description" className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  id="create-drive-description"
                  name="create-drive-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  placeholder="Describe the role and what you're looking for..."
                  rows={5}
                  className={`${INPUT_STYLE} min-h-[120px] resize-y`}
                />
                <p className="mt-1 text-right text-xs text-slate-400">{description.length}/500</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="create-drive-deadline" className="mb-1 block text-sm font-medium text-slate-700">Deadline</label>
                  <input
                    id="create-drive-deadline"
                    name="create-drive-deadline"
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className={INPUT_STYLE}
                  />
                  {deadline && (
                    <p className="mt-1 text-xs text-slate-500">
                      <Calendar className="inline h-3.5 w-3.5" /> {formatDateTime(deadline)}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="create-drive-max-applicants" className="mb-1 block text-sm font-medium text-slate-700">Max Applicants</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => !unlimited && setMaxApplicants((m) => Math.max(1, m - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      id="create-drive-max-applicants"
                      name="create-drive-max-applicants"
                      type="number"
                      min={1}
                      value={maxApplicants}
                      onChange={(e) => setMaxApplicants(parseInt(e.target.value, 10) || 1)}
                      disabled={unlimited}
                      className={`${INPUT_STYLE} flex-1 text-center`}
                    />
                    <button
                      type="button"
                      onClick={() => !unlimited && setMaxApplicants((m) => m + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <label htmlFor="create-drive-unlimited" className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                    <input
                      id="create-drive-unlimited"
                      name="create-drive-unlimited"
                      type="checkbox"
                      checked={unlimited}
                      onChange={(e) => setUnlimited(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    Unlimited
                  </label>
                </div>
              </div>
              <div>
                <label htmlFor="create-drive-skill-input" className="mb-1 block text-sm font-medium text-slate-700">Skills</label>
                <div className="flex flex-wrap gap-2 rounded-lg border border-[#E2E8F0] p-2 focus-within:ring-2 focus-within:ring-blue-500/20">
                  {skills.map((s, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                    >
                      {s}
                      <button type="button" onClick={() => removeSkill(i)} className="hover:text-blue-900">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    id="create-drive-skill-input"
                    name="create-drive-skill-input"
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(); } }}
                    placeholder="e.g. Python, React..."
                    className="min-w-[120px] flex-1 border-0 bg-transparent p-1 text-sm focus:outline-none focus:ring-0"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="mb-2 text-sm text-slate-500">Students will answer these questions when applying.</p>
              {questions.length === 0 ? (
                <div className="relative">
                  <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-slate-200 py-12 text-center">
                    <FileQuestion className="h-12 w-12 text-slate-300" />
                    <p className="mt-4 font-medium text-slate-600">Add questions to your application form</p>
                    <p className="mt-1 text-sm text-slate-500">Students will see these when they apply.</p>
                    <button
                      type="button"
                      onClick={() => setAddQuestionOpen(true)}
                      className="mt-6 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                    >
                      + Add First Question
                    </button>
                  </div>
                  {addQuestionOpen && (
                    <>
                      <div
                        className="absolute inset-0 z-10 rounded-xl"
                        aria-hidden
                        onClick={() => setAddQuestionOpen(false)}
                      />
                      <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                        {QUESTION_TYPES.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => addQuestion(t.id)}
                            className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-slate-50"
                          >
                            <t.icon className="h-5 w-5 text-slate-500" />
                            <div>
                              <p className="text-sm font-medium text-slate-800">{t.label}</p>
                              <p className="text-xs text-slate-500">{t.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={questions.map((q) => q.questionId)} strategy={verticalListSortingStrategy}>
                      {questions.map((q, i) => (
                        <SortableQuestionCard
                          key={q.questionId}
                          question={q}
                          index={i}
                          onUpdate={(updated) => updateQuestion(i, updated)}
                          onRemove={() => removeQuestion(i)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                  <div className="relative mt-4">
                    <button
                      type="button"
                      onClick={() => setAddQuestionOpen(!addQuestionOpen)}
                      className="w-full rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    >
                      + Add Question
                    </button>
                    {addQuestionOpen && (
                      <>
                        <div className="absolute inset-0 z-10" onClick={() => setAddQuestionOpen(false)} />
                        <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                          {QUESTION_TYPES.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => addQuestion(t.id)}
                              className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-slate-50"
                            >
                              <t.icon className="h-5 w-5 text-slate-500" />
                              <div>
                                <p className="text-sm font-medium text-slate-800">{t.label}</p>
                                <p className="text-xs text-slate-500">{t.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <h3 className="text-sm font-semibold text-slate-800">Drive Summary</h3>
                <p className="mt-1 font-medium text-slate-900">{title || "—"}</p>
                <p className="text-sm text-slate-600">{roleTitle || "—"}</p>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{description || "—"}</p>
                <p className="mt-2 text-xs text-slate-500">Deadline: {deadline ? formatDateTime(deadline) : "—"}</p>
                <p className="text-xs text-slate-500">Max: {unlimited ? "Unlimited" : maxApplicants}</p>
                {skills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {skills.map((s, i) => (
                      <span key={i} className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-slate-800">Form Preview</h3>
                <div className="mt-3 space-y-3">
                  {questions.length === 0 ? (
                    <p className="text-sm text-slate-500">No questions</p>
                  ) : (
                    questions.map((q, i) => (
                      <div key={i}>
                        <p className="text-xs font-medium text-slate-500">
                          {q.label || "Question " + (i + 1)} {q.required && "*"}
                        </p>
                        <p className="text-xs text-slate-400">{q.type}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3 md:col-span-2 md:flex-row">
                <button
                  type="button"
                  onClick={submitDraft}
                  disabled={submitting || !validateStep1()}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {isEdit ? "Save Changes" : "Save as Draft"}
                </button>
                {(!isEdit || initialDrive?.status === "draft") && (
                  <button
                    type="button"
                    onClick={submitPublish}
                    disabled={submitting || !validateStep1()}
                    className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {submitting ? "..." : (
                      <>
                        <Rocket className="inline h-4 w-4" /> {isEdit ? "Publish" : "Publish Drive"}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-slate-100 px-6 py-4">
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Back
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 1 && !validateStep1()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Continue →
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}
