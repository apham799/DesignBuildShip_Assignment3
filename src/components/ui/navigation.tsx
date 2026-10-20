"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cx } from "./cx";

type Tab = { href: string; label: string; icon: ReactNode; match: (path: string) => boolean };

const iconProps = { viewBox: "0 0 24 24", className: "size-6", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

const tabs: Tab[] = [
  {
    href: "/",
    label: "Home",
    match: (p) => p === "/",
    icon: (
      <svg {...iconProps}>
        <path d="M4 11 L12 4 L20 11 V20 H14 V14 H10 V20 H4 Z" />
      </svg>
    ),
  },
  {
    href: "/play",
    label: "Play",
    match: (p) => p.startsWith("/play") || p.startsWith("/round"),
    icon: (
      <svg {...iconProps}>
        <path d="M8 21 V3 L18 7 L8 11" />
        <ellipse cx="9" cy="21" rx="5" ry="1" />
      </svg>
    ),
  },
  {
    href: "/practice",
    label: "Practice",
    match: (p) => p.startsWith("/practice"),
    icon: (
      <svg {...iconProps}>
        <path d="M5 10 H19 L17 20 H7 Z" />
        <circle cx="9" cy="7" r="2" />
        <circle cx="14" cy="6" r="2" />
      </svg>
    ),
  },
  {
    href: "/history",
    label: "History",
    match: (p) => p.startsWith("/history"),
    icon: (
      <svg {...iconProps}>
        <rect x="5" y="3" width="14" height="18" rx="1.5" />
        <path d="M9 8 H15 M9 12 H15 M9 16 H13" />
      </svg>
    ),
  },
];

export function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-sm text-green">
      <svg viewBox="0 0 28 28" className="size-7" aria-hidden>
        <path d="M5 11 H23 L20.5 25 H7.5 Z" fill="currentColor" />
        <circle cx="10" cy="7.5" r="3" fill="#fff" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="16.5" cy="6" r="3" fill="#fff" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="13.5" cy="10" r="2.6" fill="#fff" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      <span className="font-display text-xl font-semibold text-ink">Bucket List</span>
    </Link>
  );
}

// One nav everywhere: a top bar on wide screens, a bottom tab bar on phones.
export function AppNav() {
  return <NavBar path={usePathname()} />;
}

// Rendered with path=null while the URL is not known yet (prerendering), so the
// nav is in the first HTML and the active tab fills in on hydration.
export function NavBar({ path }: { path: string | null }) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-cream-deep bg-cream/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between px-4 sm:px-6 lg:px-12">
          <BrandMark />
          <div className="flex items-center gap-3">
            <nav aria-label="Main" className="hidden sm:block">
              <ul className="flex gap-1">
                {tabs.map((t) => {
                  const active = path !== null && t.match(path);
                  return (
                    <li key={t.href}>
                      <Link
                        href={t.href}
                        aria-current={active ? "page" : undefined}
                        className={cx("flex h-10 items-center rounded-md px-3 text-body font-semibold transition-colors", active ? "bg-green text-on-green" : "text-ink hover:bg-cream-deep")}
                      >
                        {t.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 border-t border-cream-deep bg-cream pb-[env(safe-area-inset-bottom)] sm:hidden">
        <ul className="grid grid-cols-4">
          {tabs.map((t) => {
            const active = path !== null && t.match(path);
            return (
              <li key={t.href}>
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={cx("flex h-16 flex-col items-center justify-center gap-0.5 text-label", active ? "text-green" : "text-muted hover:text-ink")}
                >
                  <span className={cx("grid h-8 w-14 place-items-center rounded-full transition-colors", active && "bg-green text-on-green")}>{t.icon}</span>
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

type PageHeaderProps = {
  title: string;
  // Where "back" goes inside a flow, e.g. from a hole back to the course list.
  back?: { href: string; label: string };
  // Where you are in a flow, e.g. "Hole 4 of 18".
  step?: string;
  description?: ReactNode;
  action?: ReactNode;
};

export function PageHeader({ title, back, step, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2">
      {back && (
        <Link href={back.href} className="-ml-1 flex w-fit items-center gap-1 rounded-sm px-1 text-body font-semibold text-green hover:underline">
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3 L5 8 L10 13" />
          </svg>
          {back.label}
        </Link>
      )}
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          {step && <p className="text-label text-muted">{step}</p>}
          <h1 className="text-display">{title}</h1>
        </div>
        {action}
      </div>
      {description && <div className="max-w-2xl text-body text-muted">{description}</div>}
    </div>
  );
}
