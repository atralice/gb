import { cn } from "@/lib/cn";

type NavButtonProps = {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  size?: "sm" | "xs";
};

const NavButton = ({
  isActive,
  onClick,
  children,
  size = "xs",
}: NavButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded font-medium transition-colors",
        size === "xs" && "px-2 py-1 text-xs",
        size === "sm" && "px-2.5 py-1.5 text-sm",
        isActive
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      )}
    >
      {children}
    </button>
  );
};

export default NavButton;
