import React from "react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function PageTitle({ className, children, ...props }) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return (
    <h1
      className={cx(
        "text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

export function SectionTitle({ className, children, ...props }) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return (
    <h2
      className={cx(
        "text-lg font-semibold text-slate-900 dark:text-slate-100",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

export function Subheading({ className, children, ...props }) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return (
    <h3
      className={cx(
        "text-sm font-semibold text-slate-700 dark:text-slate-300",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function BodyText({ className, children, ...props }) {
  // eslint-disable-next-line react/jsx-props-no-spreading
  return (
    <p
      className={cx(
        "text-sm text-slate-600 dark:text-slate-400",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

