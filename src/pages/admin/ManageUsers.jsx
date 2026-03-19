import React, { useState } from "react";
import useAdminStudents, { updateAdminStudent } from "../../hooks/useAdminStudents";

const ROLE_LABELS = {
  student: { label: "Student", cls: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  faculty_coordinator: { label: "Faculty Coordinator", cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  faculty: { label: "Faculty", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  admin: { label: "Admin", cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
};

function RoleBadge({ role }) {
  const cfg = ROLE_LABELS[role] || ROLE_LABELS.student;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function ConfirmDialog({ open, title, description, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="btn-primary rounded-xl px-4 py-2 text-sm font-semibold text-white dark:bg-primary dark:hover:bg-primary/90"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManageUsers() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [page, setPage] = useState(1);
  const [loadingId, setLoadingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const { data, loading, error, refetch } = useAdminStudents({
    search,
    department: department || undefined,
    year: year || undefined,
    page,
    limit: 20,
  });

  const { items, total, pages } = data;

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleRoleChange = (id, newRole, currentRole, userName) => {
    setConfirm({
      title: "Change role?",
      description: `Change ${userName}'s role from "${ROLE_LABELS[currentRole]?.label}" to "${ROLE_LABELS[newRole]?.label}"? This will affect their access immediately.`,
      onConfirm: async () => {
        setConfirm(null);
        setLoadingId(id + "_role");
        const res = await updateAdminStudent(id, { role: newRole });
        setLoadingId(null);
        if (res?.success) {
          showToast(`Role updated to ${ROLE_LABELS[newRole]?.label}.`);
          refetch();
        } else {
          showToast(res?.message || "Role update failed.", false);
        }
      },
      onCancel: () => setConfirm(null),
    });
  };

  const handleStatusToggle = async (id, isActive) => {
    setLoadingId(id + "_status");
    const res = await updateAdminStudent(id, { isActive });
    setLoadingId(null);
    if (res?.success) {
      showToast(isActive ? "User activated." : "User deactivated.");
      refetch();
    } else {
      showToast("Status update failed.", false);
    }
  };

  return (
    <div className="admin-page-shell flex flex-1 flex-col min-w-0 overflow-x-hidden">
      <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full">
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-xl transition-all ${
              toast.ok ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
            }`}
          >
            {toast.msg}
          </div>
        )}

        <ConfirmDialog
          open={!!confirm}
          title={confirm?.title}
          description={confirm?.description}
          onConfirm={confirm?.onConfirm}
          onCancel={confirm?.onCancel}
        />

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Manage Users
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              Manage student, club leader, faculty and admin accounts.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              placeholder="Search name, email, ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <select
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="ME">ME</option>
              <option value="IT">IT</option>
              <option value="EE">EE</option>
            </select>
            <select
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-2" />
              Loading users...
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-rose-600 dark:text-rose-400">{error}</div>
          ) : items.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Dept / Year</th>
                    <th className="px-5 py-3">Current Role</th>
                    <th className="px-5 py-3">Change Role</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((u) => (
                    <tr
                      key={u._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {u.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {u.name}
                            </p>
                            {u.studentId && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                ID: {u.studentId}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                        {u.email}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-slate-700 dark:text-slate-200">
                          {u.department || "—"}
                        </p>
                        {u.year && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Year {u.year}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-5 py-3.5">
                        {loadingId === u._id + "_role" ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : (
                          <select
                            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-800 focus:border-primary focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            value={u.role}
                            onChange={(e) =>
                              handleRoleChange(u._id, e.target.value, u.role, u.name)
                            }
                          >
                            <option value="student">Student</option>
                            <option value="faculty_coordinator">Faculty Coordinator</option>
                            <option value="faculty">Faculty</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {loadingId === u._id + "_status" ? (
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStatusToggle(u._id, !u.isActive)}
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors hover:opacity-80 ${
                              u.isActive
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {u.isActive ? "Active" : "Inactive"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {total > 0 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
              <p>
                Page {page} of {pages} · {total} users total
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
