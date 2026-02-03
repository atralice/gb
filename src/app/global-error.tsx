"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-50">
        <main className="flex min-h-screen flex-col items-center justify-center p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              Algo salió mal
            </h1>
            <p className="text-slate-600 mb-6">
              Hubo un error al cargar la página. Por favor, intentá de nuevo.
            </p>
            <button
              onClick={() => reset()}
              className="rounded-xl bg-slate-800 px-6 py-3 text-white font-medium hover:bg-slate-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
