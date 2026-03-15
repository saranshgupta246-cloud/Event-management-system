import React from "react";
import { Link } from "react-router-dom";

const baseClasses =
  "inline-flex items-center justify-center rounded-full font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const sizeClasses = {
  sm: "text-xs px-3 py-1.5",
  md: "text-sm px-4 py-2",
  lg: "text-sm px-5 py-2.5",
};

const variantClasses = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-500",
  secondary:
    "bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-800",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
  chip:
    "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800",
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function ButtonBase(
  { asChild = false, as: Comp = "button", variant = "primary", size = "md", className, children, ...props },
  ref
) {
  const classes = cx(
    baseClasses,
    sizeClasses[size] || sizeClasses.md,
    variantClasses[variant] || variantClasses.primary,
    className
  );

  if (asChild && Comp === "button") {
    // Allow passing a Link or other component via children when asChild is true
    // eslint-disable-next-line react/jsx-props-no-spreading
    return React.cloneElement(children, {
      className: cx(classes, children.props.className),
      ref,
    });
  }

  if (Comp === Link) {
    // eslint-disable-next-line react/jsx-props-no-spreading
    return (
      <Link ref={ref} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  // eslint-disable-next-line react/jsx-props-no-spreading
  return (
    <Comp ref={ref} className={classes} {...props}>
      {children}
    </Comp>
  );
}

const Button = React.forwardRef(ButtonBase);

export default Button;

