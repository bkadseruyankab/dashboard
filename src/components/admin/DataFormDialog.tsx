"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import CurrencyInput from "./CurrencyInput";
import { usePengaturan } from "@/context/PengaturanContext";

export type FormField = {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "switch" | "currency";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  min?: number;
};

interface DataFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FormField[];
  initialData: Record<string, unknown> | null;
  onSubmit: (data: Record<string, unknown>) => void;
  loading: boolean;
  resetKey?: string | number;
}

export default function DataFormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  initialData,
  onSubmit,
  loading,
  resetKey,
}: DataFormDialogProps) {
  const { pengaturan } = usePengaturan();

  const getInitialFormData = () => {
    if (initialData) return { ...initialData };
    const defaults: Record<string, unknown> = {};
    fields.forEach((f) => {
      if (f.type === "switch") defaults[f.name] = false;
      else if (f.type === "number" || f.type === "currency") defaults[f.name] = "";
      else defaults[f.name] = "";
    });
    return defaults;
  };

  const [formData, setFormData] = useState<Record<string, unknown>>(getInitialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastResetKey, setLastResetKey] = useState(resetKey);

  // Reset form when resetKey changes (dialog re-opened)
  if (resetKey !== lastResetKey) {
    setFormData(getInitialFormData());
    setErrors({});
    setLastResetKey(resetKey);
  }

  const handleChange = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.required) {
        const val = formData[f.name];
        if (f.type === "switch") return; // switches are always valid
        if (val === undefined || val === null || val === "") {
          newErrors[f.name] = `${f.label} wajib diisi`;
        }
        if ((f.type === "number" || f.type === "currency") && val !== "" && val !== undefined) {
          const numVal = Number(val);
          if (isNaN(numVal)) {
            newErrors[f.name] = `${f.label} harus berupa angka`;
          }
          if (f.min !== undefined && numVal < f.min) {
            newErrors[f.name] = `${f.label} minimal ${f.min}`;
          }
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const processed: Record<string, unknown> = {};
    fields.forEach((f) => {
      const val = formData[f.name];
      if (f.type === "number" || f.type === "currency") {
        processed[f.name] = val === "" || val === undefined ? 0 : Number(val);
      } else if (f.type === "switch") {
        processed[f.name] = Boolean(val);
      } else {
        processed[f.name] = val;
      }
    });
    onSubmit(processed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name} className="space-y-2">
              {field.type === "switch" ? (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor={field.name} className="cursor-pointer">
                    {field.label}
                  </Label>
                  <Switch
                    id={field.name}
                    checked={Boolean(formData[field.name])}
                    onCheckedChange={(checked) =>
                      handleChange(field.name, checked)
                    }
                  />
                </div>
              ) : field.type === "currency" ? (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>
                  <CurrencyInput
                    id={field.name}
                    value={formData[field.name] ?? ""}
                    onChange={(numValue) => handleChange(field.name, numValue)}
                    placeholder={field.placeholder}
                    min={field.min}
                  />
                  {errors[field.name] && (
                    <p className="text-xs text-red-500">{errors[field.name]}</p>
                  )}
                </div>
              ) : field.type === "select" ? (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>
                  <Select
                    value={String(formData[field.name] ?? "")}
                    onValueChange={(val) => handleChange(field.name, val)}
                  >
                    <SelectTrigger className="w-full" id={field.name}>
                      <SelectValue placeholder={field.placeholder || `Pilih ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors[field.name] && (
                    <p className="text-xs text-red-500">{errors[field.name]}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>
                  <Input
                    id={field.name}
                    type={field.type === "number" ? "number" : "text"}
                    step={field.type === "number" ? "1" : undefined}
                    min={field.type === "number" ? field.min : undefined}
                    placeholder={field.placeholder}
                    value={formData[field.name] ?? ""}
                    onChange={(e) =>
                      handleChange(field.name, e.target.value)
                    }
                  />
                  {errors[field.name] && (
                    <p className="text-xs text-red-500">{errors[field.name]}</p>
                  )}
                </div>
              )}
            </div>
          ))}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="text-white hover:opacity-90"
              style={{ backgroundColor: pengaturan.warnaPrimary }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : initialData ? (
                "Simpan Perubahan"
              ) : (
                "Tambah Data"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
