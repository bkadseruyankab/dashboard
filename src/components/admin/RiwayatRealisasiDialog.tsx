"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Inbox } from "lucide-react";
import { formatRupiahFull } from "@/components/dashboard/types";

type RealisasiLogEntry = {
  id: string;
  sumberType: string;
  sumberId: string;
  tahunAnggaranId: string;
  kodeAkun: string;
  namaAkun: string;
  kategori: string | null;
  anggaranSebelum: number;
  anggaranSesudah: number;
  realisasiSebelum: number;
  realisasiSesudah: number;
  tanggalPerubahan: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type SumberType = "Pendapatan" | "Belanja" | "Pembiayaan" | "RealisasiSkpd";

function getSumberTypeBadgeClass(sumberType: string): string {
  switch (sumberType) {
    case "Pendapatan":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Belanja":
      return "bg-red-100 text-red-800 border-red-200";
    case "Pembiayaan":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "RealisasiSkpd":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function formatDateId(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatChangeValue(before: number, after: number): React.ReactNode {
  const diff = after - before;
  if (diff === 0) {
    return (
      <div className="text-xs font-mono">
        <div>{formatRupiahFull(after)}</div>
        <div className="text-muted-foreground text-[10px]">tidak berubah</div>
      </div>
    );
  }
  return (
    <div className="text-xs font-mono">
      <div>{formatRupiahFull(after)}</div>
      <div className={diff > 0 ? "text-emerald-600" : "text-red-600"}>
        {diff > 0 ? "+" : ""}
        {formatRupiahFull(diff)}
      </div>
    </div>
  );
}

interface RiwayatRealisasiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sumberType: SumberType;
  sumberId: string;
  itemName: string;
}

export default function RiwayatRealisasiDialog({
  open,
  onOpenChange,
  sumberType,
  sumberId,
  itemName,
}: RiwayatRealisasiDialogProps) {
  const [logs, setLogs] = useState<RealisasiLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchLogs = useCallback(async () => {
    if (!sumberId || !sumberType) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        sumberType,
        sumberId,
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      const res = await fetch(`/api/admin/realisasi-log?${params}`);
      if (!res.ok) throw new Error("Gagal memuat riwayat realisasi");
      const json = await res.json();
      setLogs(json.data || []);
      if (json.pagination) {
        setPagination(json.pagination);
      }
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [sumberType, sumberId, pagination.page, pagination.limit]);

  useEffect(() => {
    if (open && sumberId && sumberType) {
      fetchLogs();
    }
  }, [open, fetchLogs, sumberId, sumberType]);

  // Reset page when dialog opens
  useEffect(() => {
    if (open) {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }
  }, [open]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={getSumberTypeBadgeClass(sumberType)}
            >
              {sumberType}
            </Badge>
            Riwayat Realisasi — {itemName}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead className="w-44">Tgl Perubahan</TableHead>
                  <TableHead className="text-right">Anggaran Sebelum</TableHead>
                  <TableHead className="text-right">Anggaran Sesudah</TableHead>
                  <TableHead className="text-right">Realisasi Sebelum</TableHead>
                  <TableHead className="text-right">Realisasi Sesudah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">
                        Memuat riwayat...
                      </p>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Inbox className="w-8 h-8" />
                        <p className="text-sm">
                          Belum ada riwayat perubahan realisasi
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log, idx) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-center text-muted-foreground text-xs">
                        {(pagination.page - 1) * pagination.limit + idx + 1}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-normal">
                        {formatDateId(log.tanggalPerubahan)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs font-mono">
                          {formatRupiahFull(log.anggaranSebelum)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatChangeValue(
                          log.anggaranSebelum,
                          log.anggaranSesudah
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs font-mono">
                          {formatRupiahFull(log.realisasiSebelum)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatChangeValue(
                          log.realisasiSebelum,
                          log.realisasiSesudah
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-muted-foreground">
              Halaman {pagination.page} dari {pagination.totalPages} (
              {pagination.total} data)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
