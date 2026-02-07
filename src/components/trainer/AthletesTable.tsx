"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { TrainerAthlete } from "@/lib/trainer/getTrainerAthletes";

type AthletesTableProps = {
  athletes: TrainerAthlete[];
};

export default function AthletesTable({ athletes }: AthletesTableProps) {
  const [search, setSearch] = useState("");

  const filtered = athletes.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  if (athletes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No tenés atletas asignados</p>
      </div>
    );
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar atleta..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
      />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                Nombre
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                Última actividad
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">
                Completado
              </th>
              <th className="text-center px-4 py-3 text-sm font-medium text-slate-600">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((athlete) => (
              <tr
                key={athlete.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/trainer/athletes/${athlete.id}`}
                    className="text-sm font-medium text-slate-900 hover:text-slate-600"
                  >
                    {athlete.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {athlete.lastActivity
                    ? formatDistanceToNow(athlete.lastActivity, {
                        addSuffix: true,
                        locale: es,
                      })
                    : "Sin actividad"}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {athlete.weeklyCompletion.total > 0 ? (
                    <>
                      {Math.round(
                        (athlete.weeklyCompletion.completed /
                          athlete.weeklyCompletion.total) *
                          100
                      )}
                      %{" "}
                      <span className="text-slate-400">
                        ({athlete.weeklyCompletion.completed}/
                        {athlete.weeklyCompletion.total})
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {athlete.needsAttention ? (
                    <span
                      className="text-amber-500"
                      title={
                        athlete.attentionReason === "inactive"
                          ? "Sin actividad reciente"
                          : "Necesita nueva semana"
                      }
                    >
                      ⚠️
                    </span>
                  ) : (
                    <span className="text-emerald-500">✓</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
