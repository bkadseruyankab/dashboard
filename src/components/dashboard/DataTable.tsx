"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardData, formatRupiahFull, formatPersentase } from "./types";
import { motion } from "framer-motion";
import { FileText, Building2 } from "lucide-react";

type DataTableProps = {
  data: DashboardData;
  type: "akun" | "skpd";
};

function getRealisasiColor(persentase: number): string {
  if (persentase >= 90) return "bg-emerald-100 text-emerald-800";
  if (persentase >= 75) return "bg-amber-100 text-amber-800";
  if (persentase >= 50) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

function getRealisasiBarColor(persentase: number): string {
  if (persentase >= 90) return "bg-emerald-500";
  if (persentase >= 75) return "bg-amber-500";
  if (persentase >= 50) return "bg-orange-500";
  return "bg-red-500";
}

export default function DataTable({ data, type }: DataTableProps) {
  const isAkun = type === "akun";
  const items = isAkun ? data.realisasiAkun : data.realisasiSkpd;
  const title = isAkun ? "Realisasi Per-Akun" : "Realisasi Per-SKPD";
  const Icon = isAkun ? FileText : Building2;

  // Group by jenis for akun type
  const groupedData = isAkun
    ? items.reduce(
        (acc, item) => {
          const jenis = (item as { jenis: string }).jenis;
          if (!acc[jenis]) acc[jenis] = [];
          acc[jenis].push(item);
          return acc;
        },
        {} as Record<string, typeof items>
      )
    : { "Semua SKPD": items };

  const jenisLabels: Record<string, string> = {
    Pendapatan: "Pendapatan Daerah",
    Belanja: "Belanja Daerah",
    Pembiayaan: "Pembiayaan",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <Card className="shadow-md border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-100">
              <Icon className="w-4 h-4 text-emerald-700" />
            </div>
            {title}
            <Badge variant="secondary" className="ml-auto text-[10px]">
              TA {data.tahun}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[500px]">
            {Object.entries(groupedData).map(([group, groupItems]) => (
              <div key={group}>
                {isAkun && (
                  <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-4 py-2 border-b">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                      {jenisLabels[group] || group}
                    </h3>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[11px] font-semibold w-[50px]">
                        Kode
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold">
                        {isAkun ? "Nama Akun" : "Nama SKPD/OPD"}
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold text-right">
                        Anggaran
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold text-right">
                        Realisasi
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold text-center w-[120px]">
                        Persentase
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupItems.map((item, idx) => {
                      const persentase = item.persentase;
                      const kode = isAkun
                        ? (item as { kodeAkun: string }).kodeAkun
                        : (item as { kodeSkpd: string }).kodeSkpd;
                      const nama = isAkun
                        ? (item as { namaAkun: string }).namaAkun
                        : (item as { namaSkpd: string }).namaSkpd;

                      return (
                        <TableRow
                          key={item.id}
                          className="group hover:bg-muted/50 transition-colors"
                        >
                          <TableCell className="text-[11px] text-muted-foreground font-mono">
                            {kode}
                          </TableCell>
                          <TableCell className="text-[11px] font-medium max-w-[200px] truncate">
                            {nama}
                          </TableCell>
                          <TableCell className="text-[11px] text-right font-mono">
                            {formatRupiahFull(item.anggaran)}
                          </TableCell>
                          <TableCell className="text-[11px] text-right font-mono">
                            {formatRupiahFull(item.realisasi)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${getRealisasiBarColor(persentase)}`}
                                  style={{
                                    width: `${Math.min(persentase, 100)}%`,
                                  }}
                                />
                              </div>
                              <Badge
                                variant="secondary"
                                className={`text-[10px] px-1.5 py-0 h-5 ${getRealisasiColor(persentase)}`}
                              >
                                {formatPersentase(persentase)}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Subtotal row */}
                <div className="px-4 py-2 bg-muted/30 border-t font-semibold text-xs flex justify-between">
                  <span>Subtotal {jenisLabels[group] || group}</span>
                  <div className="flex gap-6">
                    <span className="font-mono">
                      {formatRupiahFull(groupItems.reduce((s, i) => s + i.anggaran, 0))}
                    </span>
                    <span className="font-mono">
                      {formatRupiahFull(groupItems.reduce((s, i) => s + i.realisasi, 0))}
                    </span>
                    <span className="w-[80px] text-center">
                      {formatPersentase(
                        groupItems.reduce((s, i) => s + i.realisasi, 0) /
                          groupItems.reduce((s, i) => s + i.anggaran, 0) *
                          100
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}
