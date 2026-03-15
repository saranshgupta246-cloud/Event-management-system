import React from "react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Card({ className, interactive = false, children, ...props }) {
  const base =
    "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900";
  const interactiveClasses =
    "transition-transform transition-shadow hover:-translate-y-[1px] hover:shadow-md";

  // eslint-disable-next-line react/jsx-props-no-spreading
  return (
    <div
      className={cx(base, interactive ? interactiveClasses : "", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return (
    <div className={cx("px-5 py-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...props }) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return (
    <div className={cx("px-5 py-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return (
    <div className={cx("px-5 py-3 border-t border-slate-100 dark:border-slate-800", className)} {...props}>
      {children}
    </div>
  );
}

