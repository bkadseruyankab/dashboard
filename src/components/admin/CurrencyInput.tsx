"use client";

import { useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps {
  value: number | string;
  onChange: (value: number) => void;
  placeholder?: string;
  id?: string;
  min?: number;
  className?: string;
}

/**
 * Formats a numeric value using Indonesian thousand separators (dots).
 * e.g., 31500000000 → "31.500.000.000"
 * Uses manual implementation for consistency across environments.
 */
function formatWithDots(num: number): string {
  if (num === 0) return "0";
  const isNegative = num < 0;
  const abs = Math.abs(Math.round(num));
  const str = abs.toString();
  const parts: string[] = [];
  let count = 0;
  for (let i = str.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) {
      parts.push(".");
    }
    parts.push(str[i]);
    count++;
  }
  const formatted = parts.reverse().join("");
  return isNegative ? "-" + formatted : formatted;
}

/**
 * Strips all non-numeric characters and parses to a number.
 * Returns 0 if the result is NaN.
 */
function parseToNumber(raw: string): number {
  const digitsOnly = raw.replace(/[^\d]/g, "");
  if (digitsOnly === "") return 0;
  const num = parseInt(digitsOnly, 10);
  return isNaN(num) ? 0 : num;
}

export default function CurrencyInput({
  value,
  onChange,
  placeholder,
  id,
  min,
  className,
}: CurrencyInputProps) {
  // Track whether the input is focused so we can manage display properly
  const [focused, setFocused] = useState(false);
  const [internalDisplay, setInternalDisplay] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // The numeric value from the parent
  const numericValue = typeof value === "number" ? value : parseToNumber(String(value));

  // Determine what to display
  // - When focused: show internal display (which the user is editing with dots)
  // - When not focused: show formatted value from the parent's numeric value
  const displayValue = focused
    ? internalDisplay ?? (numericValue === 0 ? "" : formatWithDots(numericValue))
    : numericValue === 0
      ? ""
      : formatWithDots(numericValue);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Remove all non-digit characters
      const digitsOnly = raw.replace(/[^\d]/g, "");

      // Parse to number
      const num = digitsOnly === "" ? 0 : parseInt(digitsOnly, 10);
      const clampedNum = min !== undefined && num < min ? min : num;

      // Format with dots for display
      const formatted = digitsOnly === "" ? "" : formatWithDots(clampedNum);
      setInternalDisplay(formatted);

      // Notify parent with the raw number
      onChange(clampedNum);
    },
    [onChange, min]
  );

  const handleFocus = useCallback(() => {
    // Set the internal display to the current formatted value so editing starts clean
    setInternalDisplay(numericValue === 0 ? "" : formatWithDots(numericValue));
    setFocused(true);
  }, [numericValue]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    setInternalDisplay(null);
    // Ensure the value is clamped to min on blur
    if (min !== undefined && numericValue < min) {
      onChange(min);
    }
  }, [min, numericValue, onChange]);

  // Handle paste - strip non-numeric and format
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData("text/plain");
      const digitsOnly = pastedText.replace(/[^\d]/g, "");
      const num = digitsOnly === "" ? 0 : parseInt(digitsOnly, 10);
      const clampedNum = min !== undefined && num < min ? min : num;

      setInternalDisplay(clampedNum === 0 ? "" : formatWithDots(clampedNum));
      onChange(clampedNum);
    },
    [onChange, min]
  );

  // Prevent non-numeric key presses (allow backspace, delete, arrow keys, etc.)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow: backspace, delete, tab, escape, enter, arrows
      if (
        [8, 9, 13, 27, 46, 37, 38, 39, 40].includes(e.keyCode) ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        ((e.ctrlKey || e.metaKey) && [65, 67, 86, 88].includes(e.keyCode))
      ) {
        return;
      }
      // Block non-numeric
      if (
        (e.key < "0" || e.key > "9") &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        e.preventDefault();
      }
    },
    []
  );

  return (
    <Input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="numeric"
      placeholder={placeholder || "Contoh: 31.500.000.000"}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      className={className}
      autoComplete="off"
    />
  );
}
