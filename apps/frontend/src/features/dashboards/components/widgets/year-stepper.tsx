import { Button } from "@repo/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function YearStepper({
  year,
  onChange,
}: {
  year: number;
  onChange: (year: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="size-7"
        aria-label="Previous year"
        onClick={() => onChange(year - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="w-12 text-center text-sm font-semibold tabular-nums">{year}</span>
      <Button
        variant="outline"
        size="icon"
        className="size-7"
        aria-label="Next year"
        onClick={() => onChange(year + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
