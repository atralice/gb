import { cn } from "@/lib/cn";

type BlockHeaderProps = {
  title: string;
  comment?: string | null;
  tags?: string[];
};

const tagColorClasses = [
  "border-emerald-200 bg-emerald-50 text-emerald-700",
  "border-sky-200 bg-sky-50 text-sky-700",
  "border-purple-200 bg-purple-50 text-purple-700",
  "border-orange-200 bg-orange-50 text-orange-700",
  "border-rose-200 bg-rose-50 text-rose-700",
];

const BlockHeader = ({ title, comment, tags = [] }: BlockHeaderProps) => {
  return (
    <header className="mb-1.5 flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
          {title}
        </span>
        {tags.map((tag, index) => (
          <span
            key={tag}
            className={cn(
              "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium",
              tagColorClasses[index % tagColorClasses.length]
            )}
          >
            {tag}
          </span>
        ))}
      </div>
      {comment && <span className="text-[10px] text-slate-500">{comment}</span>}
    </header>
  );
};

export default BlockHeader;
