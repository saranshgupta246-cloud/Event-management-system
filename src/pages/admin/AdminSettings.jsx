import React, { useState } from "react";
import useDepartments, {
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../hooks/useDepartments";
import { Plus, Pencil, Trash2, X, Building2 } from "lucide-react";

function DeptModal({ initial, onClose, onSaved }) {
  const [fullName, setFullName] = useState(initial?.fullName || "");
  const [shortName, setShortName] = useState(initial?.shortName || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    setErr("");
    if (!fullName.trim()) {
      setErr("Full name is required.");
      return;
    }
    if (!shortName.trim()) {
      setErr("Short name is required.");
      return;
    }
    setSaving(true);
    const payload = {
      fullName: fullName.trim(),
      shortName: shortName.trim().toUpperCase(),
    };
    const res = initial?._id
      ? await updateDepartment(initial._id, payload)
      : await createDepartment(payload);
    setSaving(false);
    if (res?.success) {
      onSaved();
      onClose();
    } else {
      setErr(res?.message || "Failed to save department.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#1e2d42] dark:bg-[#161f2e]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {initial ? "Edit Department" : "Add Department"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Computer Science & Engineering"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-[#1e2d42] dark:bg-[#0d1117] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Short Name * (e.g. CSE, IT, ECE)
            </label>
            <input
              type="text"
              value={shortName}
              onChange={(e) =>
                setShortName(e.target.value.toUpperCase().slice(0, 10))
              }
              placeholder="CSE"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-mono dark:border-[#1e2d42] dark:bg-[#0d1117] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          {err && <p className="text-xs text-rose-600">{err}</p>}
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-[#1e2d42] hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const { departments, loading, error, refetch } = useDepartments();
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await deleteDepartment(deleteTarget._id);
    setDeleting(false);
    setDeleteTarget(null);
    if (res?.success) {
      showToast("Department deleted.");
      refetch();
    } else {
      showToast(res?.message || "Failed to delete.", false);
    }
  };

  return (
    <div className="admin-page-shell flex flex-1 flex-col min-w-0 overflow-x-hidden">
      <div className="p-6 sm:p-8 max-w-4xl mx-auto w-full">
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-xl ${
              toast.ok ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
            }`}
          >
            {toast.msg}
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Manage system-wide configuration.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1e2d42] dark:bg-[#161f2e]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1e2d42]">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Departments
              </h2>
              <span className="ml-2 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {departments.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setModal({ mode: "add" })}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Add Department
            </button>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
              Loading…
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-rose-600">{error}</div>
          ) : departments.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No departments yet. Add your first department.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {departments.map((d) => (
                <div
                  key={d._id}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                      {d.fullName}
                    </p>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                      {d.shortName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModal({ mode: "edit", dept: d })}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(d)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <DeptModal
          initial={modal.mode === "edit" ? modal.dept : null}
          onClose={() => setModal(null)}
          onSaved={() => {
            showToast(
              modal.mode === "edit"
                ? "Department updated."
                : "Department created."
            );
            refetch();
          }}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#1e2d42] dark:bg-[#161f2e]">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Delete department?
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Delete{" "}
              <strong className="text-slate-700 dark:text-slate-200">
                {deleteTarget.shortName}
              </strong>{" "}
              — {deleteTarget.fullName}? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-[#1e2d42] hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

