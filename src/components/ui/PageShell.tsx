import type { ReactNode } from "react";
import Link from "next/link";
import BackArrow from "./BackArrow";

type PageShellProps = {
  backHref?: string;
  title: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

export default function PageShell({
  backHref,
  title,
  actions,
  children,
}: PageShellProps) {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {backHref && (
              <Link
                href={backHref}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Volver"
              >
                <BackArrow />
              </Link>
            )}
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          </div>
          {actions}
        </div>
      </header>
      {children}
    </main>
  );
}
