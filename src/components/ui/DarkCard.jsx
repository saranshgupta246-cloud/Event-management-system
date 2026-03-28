/**
 * Dual-mode card — light surfaces in light mode, standardized dark card in dark mode.
 */
export function DarkCard({ children, className = "", hover = false, onClick }) {
  const base =
    "rounded-2xl border border-slate-200 dark:border-[#1e2d42] bg-white dark:bg-[#161f2e] transition-colors duration-150";
  const hoverCls = hover ? " cursor-pointer" : "";

  const handleEnter = hover
    ? (e) => {
        e.currentTarget.style.borderColor = "#2d3f55";
        e.currentTarget.style.background = "#1a2640";
      }
    : undefined;
  const handleLeave = hover
    ? (e) => {
        e.currentTarget.style.borderColor = "#1e2d42";
        e.currentTarget.style.background = "#161f2e";
      }
    : undefined;

  return (
    <div
      onClick={onClick}
      className={`${base}${hoverCls} ${className}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {children}
    </div>
  );
}
