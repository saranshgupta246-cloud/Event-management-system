import React, { useState } from "react";
import { Plus, Pencil, UserPlus, Users, Trash2, AlertCircle, X } from "lucide-react";
import useAdminClubs, {
  createAdminClub,
  updateAdminClub,
  deleteAdminClub,
  assignClubLeader,
} from "../../hooks/useAdminClubs";

const CATEGORIES = ["All", "Technical", "Cultural", "Sports", "Social", "Literary", "Research"];

const EMPTY_FORM = { name: "", description: "", category: "Technical", logo: "", banner: "" };

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-5 py-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ClubForm({ form, onChange }) {
  return (
    <div className="space-y-3 px-5 py-4">
      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Club Name *</label>
        <input
          type="text"
          required
          placeholder="e.g. Code Chef MITS"
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Description</label>
        <textarea
          rows={2}
          placeholder="Short description of the club..."
          value={form.description}
          onChange={(e) => onChange("description", e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 resize-none focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Category</label>
        <select
          value={form.category}
          onChange={(e) => onChange("category", e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          {CATEGORIES.filter((c) => c !== "All").map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Logo URL</label>
        <input
          type="text"
          placeholder="https://..."
          value={form.logo}
          onChange={(e) => onChange("logo", e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      </div>
    </div>
  );
}

export default function ManageClubs() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);

  const [editClub, setEditClub] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignClub, setAssignClub] = useState(null);
  const [assignUserId, setAssignUserId] = useState("");

  const { items: clubs, loading, error, refetch } = useAdminClubs({
    search,
    category: category === "All" ? "" : category,
  });

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) { showToast("Club name is required.", false); return; }
    setSubmitting(true);
    const res = await createAdminClub(createForm);
    setSubmitting(false);
    if (res?.success) {
      showToast("Club created.");
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      refetch();
    } else {
      showToast(res?.message || "Create failed.", false);
    }
  };

  const handleEdit = async () => {
    if (!editForm.name.trim()) { showToast("Club name is required.", false); return; }
    setSubmitting(true);
    const res = await updateAdminClub(editClub._id, editForm);
    setSubmitting(false);
    if (res?.success) {
      showToast("Club updated.");
      setEditClub(null);
      refetch();
    } else {
      showToast(res?.message || "Update failed.", false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    const res = await deleteAdminClub(deleteTarget._id);
    setSubmitting(false);
    setDeleteTarget(null);
    if (res?.success) {
      showToast(res.message || "Club deleted.");
      refetch();
    } else {
      showToast(res?.message || "Delete failed.", false);
    }
  };

  const handleAssignLeader = async () => {
    if (!assignUserId.trim()) { showToast("Enter a User ID.", false); return; }
    setSubmitting(true);
    const res = await assignClubLeader(assignClub._id, assignUserId.trim());
    setSubmitting(false);
    if (res?.success) {
      showToast("Leader assigned.");
      setAssignOpen(false);
      setAssignClub(null);
      setAssignUserId("");
      refetch();
    } else {
      showToast(res?.message || "Assign failed.", false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-xl ${toast.ok ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`}>
          {!toast.ok && <AlertCircle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div className="flex flex-wrap justify-between items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Clubs</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Create clubs, assign leaders and faculty, manage members.</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create Club
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search clubs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm focus:ring-1 focus:ring-primary focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        >
          {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
            Loading clubs...
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Club</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Leader</th>
                  <th className="px-5 py-3">Members</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {clubs.map((club) => (
                  <tr key={club._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {club.logo ? (
                          <img src={club.logo} alt={club.name} className="h-10 w-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {club.name?.charAt(0)?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{club.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[200px]">{club.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{club.category || "—"}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                      {club.leader ? (
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate block max-w-[100px]" title={club.leader}>
                          {club.leader}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">No leader</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                      {club.members?.length ?? 0}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        club.status === "active" || !club.status
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>
                        {club.status === "suspended" ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => { setEditClub(club); setEditForm({ name: club.name, description: club.description || "", category: club.category || "Technical", logo: club.logo || "", banner: club.banner || "" }); }}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-700"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAssignClub(club); setAssignOpen(true); }}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-700"
                          title="Assign Leader"
                        >
                          <UserPlus className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(club)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-700"
                          title="Delete Club"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {clubs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                      No clubs found. Create your first club above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {createOpen && (
        <Modal title="Create Club" onClose={() => setCreateOpen(false)}>
          <ClubForm form={createForm} onChange={(k, v) => setCreateForm((f) => ({ ...f, [k]: v }))} />
          <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700 px-5 py-4">
            <button type="button" onClick={() => setCreateOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button type="button" onClick={handleCreate} disabled={submitting} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">
              {submitting ? "Creating..." : "Create Club"}
            </button>
          </div>
        </Modal>
      )}

      {editClub && (
        <Modal title={`Edit — ${editClub.name}`} onClose={() => setEditClub(null)}>
          <ClubForm form={editForm} onChange={(k, v) => setEditForm((f) => ({ ...f, [k]: v }))} />
          <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700 px-5 py-4">
            <button type="button" onClick={() => setEditClub(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button type="button" onClick={handleEdit} disabled={submitting} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 dark:bg-rose-900/30">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Club?</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
              You are about to delete <strong className="text-slate-900 dark:text-white">{deleteTarget.name}</strong>.
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 mb-6">
              This will also permanently delete all events and memberships linked to this club.
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
              <button type="button" onClick={handleDelete} disabled={submitting} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-60">
                {submitting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {assignOpen && assignClub && (
        <Modal title={`Assign Leader — ${assignClub.name}`} onClose={() => { setAssignOpen(false); setAssignClub(null); }}>
          <div className="px-5 py-4 space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Enter the User ID (MongoDB ObjectId) of the new club leader.
            </p>
            <input
              type="text"
              placeholder="User ID (e.g. 64abc...)"
              value={assignUserId}
              onChange={(e) => setAssignUserId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700 px-5 py-4">
            <button type="button" onClick={() => { setAssignOpen(false); setAssignClub(null); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button type="button" onClick={handleAssignLeader} disabled={submitting} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">
              {submitting ? "Assigning..." : "Assign Leader"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
