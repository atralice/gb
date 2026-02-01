import { cn } from "@/lib/cn";
import { getTagColorClass } from "@/lib/constants/tagColors";

type BlockHeaderProps = {
  title: string;
  comment?: string | null;
  tags?: string[];
  children?: React.ReactNode;
};

const BlockHeader = ({
  title,
  comment,
  tags = [],
  children,
}: BlockHeaderProps) => {
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
              getTagColorClass(index)
            )}
          >
            {tag}
          </span>
        ))}
      </div>
      {children ??
        (comment && (
          <span className="text-[10px] text-slate-500">{comment}</span>
        ))}
    </header>
  );
};

export default BlockHeader;
