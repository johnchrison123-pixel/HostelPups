import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "cta" | "ghost" | "outline" | "subtle";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--color-brand-500)] text-[var(--color-ink)] hover:bg-[var(--color-brand-600)] active:bg-[var(--color-brand-700)] shadow-[var(--shadow-md)]",
  cta:
    "bg-[var(--color-cta)] text-white hover:bg-[var(--color-cta-hover)] shadow-[var(--shadow-md)]",
  ghost:
    "bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-brand-100)]",
  outline:
    "bg-transparent text-[var(--color-ink)] border border-[var(--color-border-strong)] hover:border-[var(--color-brand-500)] hover:bg-[var(--color-brand-50)]",
  subtle:
    "bg-[var(--color-brand-100)] text-[var(--color-ink)] hover:bg-[var(--color-brand-200)]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-14 px-7 text-lg",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
  fullWidth?: boolean;
};

type ButtonAsButton = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    className,
    children,
    fullWidth,
    ...rest
  } = props;

  const classes = cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className
  );

  if ("href" in props && props.href) {
    const isExternal = props.href.startsWith("http");
    if (isExternal) {
      return (
        <a
          {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
          href={props.href}
          className={classes}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        {...(rest as Omit<
          React.AnchorHTMLAttributes<HTMLAnchorElement>,
          "href"
        >)}
        href={props.href}
        className={classes}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      className={classes}
    >
      {children}
    </button>
  );
}
