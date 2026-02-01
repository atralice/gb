"use client";

import { Drawer as VaulDrawer } from "vaul";
import { cn } from "@/lib/cn";

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

export function Drawer({ open, onOpenChange, children }: DrawerProps) {
  return (
    <VaulDrawer.Root open={open} onOpenChange={onOpenChange}>
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <VaulDrawer.Content
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50",
            "max-h-[85vh] rounded-t-3xl bg-white",
            "flex flex-col"
          )}
        >
          <div className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-slate-300" />
          <div className="overflow-y-auto p-6">{children}</div>
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
}

export function DrawerTitle({ children }: { children: React.ReactNode }) {
  return (
    <VaulDrawer.Title className="mb-4 text-lg font-semibold text-slate-900">
      {children}
    </VaulDrawer.Title>
  );
}
