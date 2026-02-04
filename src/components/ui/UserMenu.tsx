"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { logout } from "@/lib/auth/actions/logout";

type UserMenuProps = {
  userName?: string | null;
  userEmail: string;
};

export default function UserMenu({ userName, userEmail }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target;
      if (
        menuRef.current &&
        target instanceof Node &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const displayName = userName || userEmail.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full bg-slate-100 hover:bg-slate-200 p-2 transition-colors"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-300 text-sm font-medium text-slate-700">
          {initials}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg z-50">
          <div className="p-4 border-b border-slate-100">
            <p className="text-sm font-medium text-slate-900">{displayName}</p>
            <p className="text-xs text-slate-500 truncate">{userEmail}</p>
          </div>
          <div className="p-2">
            <Link
              href="/stats"
              className="block w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Estadísticas
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
