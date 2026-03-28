/**
 * Dual-mode page wrapper — standardized dark page background when `.dark` is active.
 */
export function PageShell({ children, className = "" }) {
  return (
    <div className={`min-h-screen p-6 md:p-8 bg-slate-50 dark:bg-[#0d1117] ${className}`}>{children}</div>
  );
}
