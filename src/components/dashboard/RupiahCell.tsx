"use client";

import { formatWithDots } from "./types";

type RupiahCellProps = {
  value: number;
  className?: string;
  prefix?: string;
};

/**
 * Displays a Rupiah value with proper alignment by separating "Rp" prefix
 * from the number. The "Rp" prefix is placed in a fixed-width span on the left,
 * and the number is right-aligned in the remaining space.
 *
 * This ensures "Rp" always appears at the same horizontal position across rows,
 * regardless of the number's length.
 */
export default function RupiahCell({ value, className = "", prefix }: RupiahCellProps) {
  const isNegative = value < 0;
  const formattedNumber = formatWithDots(Math.abs(value));
  const displayPrefix = prefix ?? "";

  return (
    <span className={`inline-flex items-baseline justify-end gap-1 ${className}`}>
      <span className="text-[inherit] font-[inherit] shrink-0">{displayPrefix}Rp</span>
      <span className="text-[inherit] font-[inherit] font-mono">
        {isNegative ? "-" : ""}{formattedNumber}
      </span>
    </span>
  );
}
