"use client";

type Props = {
  status: string;
  lastSavedAt: Date | null;
};

export default function SaveStatus({ status, lastSavedAt }: Props) {
  return (
    <div className="sticky top-0 z-20 flex justify-end px-4 py-2 pointer-events-none h-8">
      <span className="text-xs flex items-center gap-1">
        {status === "saving" && (
          <>
            <span className="inline-block w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            <span className="text-slate-500">Guardando...</span>
          </>
        )}
        {status === "saved" && (
          <span className="text-green-600">&#10003; Guardado</span>
        )}
        {status === "timestamp" && lastSavedAt && (
          <span className="text-slate-400">
            Guardado{" "}
            {lastSavedAt.toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </span>
    </div>
  );
}
