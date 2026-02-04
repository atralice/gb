type PersonalRecord = {
  exerciseName: string;
  weightKg: number;
  achievedAt: Date;
};

type PersonalRecordsCardProps = {
  records: PersonalRecord[];
};

export default function PersonalRecordsCard({
  records,
}: PersonalRecordsCardProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
      <h2 className="text-sm font-medium text-slate-500 mb-4">
        Records personales
      </h2>

      {records.length === 0 ? (
        <p className="text-sm text-slate-400">
          Completá sets para ver tus records
        </p>
      ) : (
        <div className="space-y-3">
          {records.map((record, index) => (
            <div
              key={record.exerciseName}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
                  {index + 1}
                </span>
                <span className="text-sm text-slate-700">
                  {record.exerciseName}
                </span>
              </div>
              <span className="text-sm font-semibold text-slate-900">
                {record.weightKg}kg
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
