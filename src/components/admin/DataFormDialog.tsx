"use client";

import { useState, useEffect, useCallback } from "react";
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
  type: "text" | "number" | "select" | "switch" | "currency" | "async-select";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  /** For async-select: URL to fetch options from. Response should be { data: Array<Record<string,unknown>> } */
  asyncOptionsUrl?: string;
  /** For async-select: key to use as value from fetched data (default: "id") */
  asyncValueKey?: string;
  /** For async-select: key to use as label from fetched data (default: "namaOpd" or "namaKategori") */
  asyncLabelKey?: string;
  /** For async-select: additional params to append to URL */
  asyncParams?: Record<string, string>;
  /** For async-select: callback to derive extra fields when selection changes */
  asyncOnSelect?: (selectedItem: Record<string, unknown>, setFormData: (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => void) => void;
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

  // Async options state: map from field name to loaded options
  const [asyncOptions, setAsyncOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const [asyncLoading, setAsyncLoading] = useState<Record<string, boolean>>({});

  // Fetch async options when dialog opens
  useEffect(() => {
    if (!open) return;
    
    const asyncFields = fields.filter((f) => f.type === "async-select" && f.asyncOptionsUrl);
    if (asyncFields.length === 0) return;

    asyncFields.forEach(async (field) => {
      setAsyncLoading((prev) => ({ ...prev, [field.name]: true }));
      try {
        const params = new URLSearchParams(field.asyncParams);
        const url = params.toString()
          ? `${field.asyncOptionsUrl}?${params}`
          : field.asyncOptionsUrl!;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch options");
        const json = await res.json();
        const rawData: Record<string, unknown>[] = json.data || [];
        const valueKey = field.asyncValueKey || "id";
        const labelKey = field.asyncLabelKey || "label";
        
        const options = rawData.map((item) => ({
          value: String(item[valueKey] ?? ""),
          label: String(item[labelKey] ?? ""),
        }));
        
        setAsyncOptions((prev) => ({ ...prev, [field.name]: options }));
      } catch {
        setAsyncOptions((prev) => ({ ...prev, [field.name]: [] }));
      } finally {
        setAsyncLoading((prev) => ({ ...prev, [field.name]: false }));
      }
    });
  }, [open, fields]);

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

  const handleAsyncSelectChange = (field: FormField, value: string) => {
    handleChange(field.name, value);
    
    // If there's a callback for deriving extra fields
    if (field.asyncOnSelect) {
      const rawOptions = asyncOptions[field.name] || [];
      // We need the raw data items to find the selected one
      // Re-fetch won't work cleanly, so let's use the options we already have
      // The callback can use setFormData directly
      field.asyncOnSelect({ [field.asyncValueKey || "id"]: value }, setFormData);
    }
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
              ) : field.type === "async-select" ? (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>
                  {asyncLoading[field.name] ? (
                    <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Memuat opsi...</span>
                    </div>
                  ) : (
                    <Select
                      value={String(formData[field.name] ?? "")}
                      onValueChange={(val) => handleAsyncSelectChange(field, val)}
                    >
                      <SelectTrigger className="w-full" id={field.name}>
                        <SelectValue placeholder={field.placeholder || `Pilih ${field.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {(asyncOptions[field.name] || []).map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                        {(asyncOptions[field.name] || []).length === 0 && (
                          <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                            Tidak ada opsi tersedia
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  )}
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
