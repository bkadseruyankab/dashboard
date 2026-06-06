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
 * Formats a numeric value using Indonesian thousand separators (dots)
 * and comma as decimal separator.
 * e.g., 31500000000.5 → "31.500.000.000,5"
 * e.g., 31500000000 → "31.500.000.000"
 */
function formatCurrency(num: number): string {
  if (num === 0) return "0";
  const isNegative = num < 0;
  const abs = Math.abs(num);

  // Split into integer and decimal parts
  const intPart = Math.floor(abs);
  const decimalPart = abs - intPart;

  // Format integer part with dots
  const intStr = intPart.toString();
  const parts: string[] = [];
  let count = 0;
  for (let i = intStr.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) {
      parts.push(".");
    }
    parts.push(intStr[i]);
    count++;
  }
  let formatted = parts.reverse().join("");

  // Add decimal part if exists (using comma)
  if (decimalPart > 0) {
    // Round to avoid floating point issues, up to 2 decimal places
    const decimalRounded = Math.round(decimalPart * 100) / 100;
    const decimalStr = decimalRounded.toString();
    const dotIndex = decimalStr.indexOf(".");
    if (dotIndex !== -1) {
      formatted += "," + decimalStr.substring(dotIndex + 1);
    }
  }

  return isNegative ? "-" + formatted : formatted;
}

/**
 * Parses an Indonesian-formatted currency string to a number.
 * - Removes dots (thousand separators)
 * - Replaces comma with dot (decimal separator)
 * - Returns 0 if the result is NaN.
 */
function parseCurrency(raw: string): number {
  if (!raw || raw.trim() === "") return 0;
  // Remove all dots (thousand separators), replace comma with dot (decimal)
  const cleaned = raw.replace(/\./g, "").replace(/,/g, ".");
  const num = parseFloat(cleaned);
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
  const [focused, setFocused] = useState(false);
  const [internalDisplay, setInternalDisplay] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // The numeric value from the parent
  const numericValue = typeof value === "number" ? value : parseCurrency(String(value));

  // Determine what to display
  const displayValue = focused
    ? internalDisplay ?? (numericValue === 0 ? "" : formatCurrency(numericValue))
    : numericValue === 0
      ? ""
      : formatCurrency(numericValue);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      // Allow only digits, dots, and one comma (for decimal)
      // Remove any character that's not digit, dot, or comma
      let cleaned = raw.replace(/[^\d.,]/g, "");

      // Ensure only one comma exists (decimal separator)
      const commaCount = (cleaned.match(/,/g) || []).length;
      if (commaCount > 1) {
        // Keep only the first comma
        const firstCommaIdx = cleaned.indexOf(",");
        cleaned = cleaned.substring(0, firstCommaIdx + 1) + cleaned.substring(firstCommaIdx + 1).replace(/,/g, "");
      }

      // Limit decimal places to 2 after comma
      const commaIdx = cleaned.indexOf(",");
      if (commaIdx !== -1 && cleaned.length - commaIdx - 1 > 2) {
        cleaned = cleaned.substring(0, commaIdx + 3);
      }

      // Parse the cleaned value
      const num = parseCurrency(cleaned);
      const clampedNum = min !== undefined && num < min ? min : num;

      // Format for display: separate integer part with dots, keep decimal as-is
      let formatted: string;
      if (cleaned === "" || cleaned === ",") {
        formatted = cleaned;
      } else {
        // Split at comma
        const hasDecimal = commaIdx !== -1;
        let intPartStr: string;
        let decimalPartStr = "";

        if (hasDecimal) {
          intPartStr = cleaned.substring(0, commaIdx);
          decimalPartStr = cleaned.substring(commaIdx); // includes the comma
        } else {
          intPartStr = cleaned;
        }

        // Remove dots from int part for parsing, then reformat
        const intDigits = intPartStr.replace(/\./g, "");
        if (intDigits === "") {
          formatted = decimalPartStr;
        } else {
          const intNum = parseInt(intDigits, 10);
          // Reformat integer part with dots
          const intFormatted = intNum === 0 ? "0" : formatCurrency(intNum).split(",")[0]; // get only the integer formatted part
          formatted = intFormatted + decimalPartStr;
        }
      }

      setInternalDisplay(formatted);
      onChange(clampedNum);
    },
    [onChange, min]
  );

  const handleFocus = useCallback(() => {
    setInternalDisplay(numericValue === 0 ? "" : formatCurrency(numericValue));
    setFocused(true);
  }, [numericValue]);

  const handleBlur = useCallback(() => {
    setFocused(false);
    setInternalDisplay(null);
    if (min !== undefined && numericValue < min) {
      onChange(min);
    }
  }, [min, numericValue, onChange]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData("text/plain");
      const num = parseCurrency(pastedText);
      const clampedNum = min !== undefined && num < min ? min : num;

      setInternalDisplay(clampedNum === 0 ? "" : formatCurrency(clampedNum));
      onChange(clampedNum);
    },
    [onChange, min]
  );

  // Allow digits, comma, backspace, delete, arrow keys, and Ctrl shortcuts
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

      // Allow comma (for decimal separator)
      if (e.key === "," || e.key === ",") {
        // Only allow if there isn't already a comma
        const current = internalDisplay ?? "";
        if (current.includes(",")) {
          e.preventDefault();
        }
        return;
      }

      // Block non-numeric (but allow dots which are managed by our onChange)
      if (
        (e.key < "0" || e.key > "9") &&
        !e.ctrlKey &&
        !e.metaKey
      ) {
        e.preventDefault();
      }
    },
    [internalDisplay]
  );

  return (
    <Input
      ref={inputRef}
      id={id}
      type="text"
      inputMode="decimal"
      placeholder={placeholder || "Contoh: 31.500.000.000,50"}
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
