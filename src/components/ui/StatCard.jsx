/**
 * Dual-mode stat / metric card.
 */
export function StatCard({ label, value, badge, icon, color }) {
  return (
    <div
      className="rounded-2xl border border-slate-200 dark:border-[#1e2d42] p-5 flex flex-col gap-3 bg-white dark:bg-[#161f2e]"
    >
      <div className="flex items-start justify-between">
        <p
          className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-[#475569]"
        >
          {label}
        </p>
        {icon && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-slate-100 dark:bg-[#1e2d42]"
          >
            {icon}
          </div>
        )}
      </div>
      {badge ? (
        badge
      ) : (
        <p
          className="text-2xl font-semibold text-slate-900 dark:text-[#f1f5f9]"
          style={color ? { color } : undefined}
        >
          {value}
        </p>
      )}
    </div>
  );
}
