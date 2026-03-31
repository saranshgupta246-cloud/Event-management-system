export const APPROVAL_STATUS_META = {
  approved: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  pending_approval: {
    label: "Pending Approval",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  },
};

export function getApprovalStatus(event) {
  return event?.approvalStatus || "approved";
}

export function isEventApproved(event) {
  return getApprovalStatus(event) === "approved";
}

export function getApprovalMeta(event) {
  return APPROVAL_STATUS_META[getApprovalStatus(event)] || APPROVAL_STATUS_META.approved;
}

export function canCreateClubEvent(user) {
  return user?.role === "faculty_coordinator" || user?.role === "admin";
}

export function canEditApprovedClubEvent(user) {
  return (
    user?.role === "admin" ||
    user?.role === "faculty_coordinator" ||
    String(user?.clubRole || "").toLowerCase() === "president"
  );
}

export function canEditEvent(event, user) {
  const approvalStatus = getApprovalStatus(event);
  if (user?.role === "admin") return true;
  if (approvalStatus !== "approved") {
    return user?.role === "faculty_coordinator";
  }
  return canEditApprovedClubEvent(user);
}

export function isVisibleToStudents(event) {
  return isEventApproved(event);
}
