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
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import CurrencyInput from "./CurrencyInput";
import { formatRupiahFull } from "@/components/dashboard/types";

interface UpdateRealisasiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Record<string, unknown> | null;
  onSubmit: (data: { realisasi: number }) => void;
  loading: boolean;
  resetKey?: string | number;
}

export default function UpdateRealisasiDialog({
  open,
  onOpenChange,
  item,
  onSubmit,
  loading,
  resetKey,
}: UpdateRealisasiDialogProps) {
  const [realisasi, setRealisasi] = useState<number>(
    item ? Number(item.realisasi) || 0 : 0
  );
  const [lastResetKey, setLastResetKey] = useState(resetKey);

  // Reset form when resetKey changes (dialog re-opened with new item)
  if (resetKey !== lastResetKey) {
    setRealisasi(item ? Number(item.realisasi) || 0 : 0);
    setLastResetKey(resetKey);
  }

  const kode = item
    ? String(item.kodeAkun ?? item.kodeSkpd ?? "")
    : "";
  const nama = item
    ? String(item.namaAkun ?? item.namaSkpd ?? "")
    : "";
  const anggaran = item ? Number(item.anggaran) || 0 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ realisasi });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Update Realisasi</DialogTitle>
          <DialogDescription>
            Perbarui nilai realisasi untuk {nama}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Kode & Nama info */}
          <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Kode</span>
              <span className="font-mono font-semibold">{kode}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Nama</span>
              <span className="font-medium text-right max-w-[280px]">{nama}</span>
            </div>
            <div className="flex items-center justify-between text-sm border-t pt-2 mt-2">
              <span className="text-muted-foreground">Anggaran</span>
              <span className="font-mono font-semibold">
                {formatRupiahFull(anggaran)}
              </span>
            </div>
          </div>

          {/* Realisasi input */}
          <div className="space-y-1.5">
            <Label htmlFor="realisasi">
              Realisasi (Rp)
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <CurrencyInput
              id="realisasi"
              value={realisasi}
              onChange={(numValue) => setRealisasi(numValue)}
              placeholder="Contoh: 92.000.000.000"
              min={0}
            />
          </div>

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
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Update Realisasi"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
