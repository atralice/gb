"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import UserMenu from "@/components/ui/UserMenu";

type NavItem = {
  label: string;
  href: string;
  match: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  {
    label: "Atletas",
    href: "/trainer/athletes",
    match: (p) => p.startsWith("/trainer/athletes"),
  },
  {
    label: "Ejercicios",
    href: "/trainer/exercises",
    match: (p) => p.startsWith("/trainer/exercises"),
  },
];

type Props = {
  userName?: string | null;
  userEmail: string;
};

export default function TrainerNav({ userName, userEmail }: Props) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4">
      <div className="flex items-center justify-between h-12">
        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        <UserMenu
          userName={userName}
          userEmail={userEmail}
          userRole="trainer"
        />
      </div>
    </nav>
  );
}
