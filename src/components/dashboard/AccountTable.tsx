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
import { formatPersentase, getRealisasiBadgeClass, getRealisasiBarClass, safePercentage, formatRupiahShort } from "./types";
import RupiahCell from "./RupiahCell";

type AccountTableProps = {
  items: Array<{
    id: string;
    kodeAkun: string;
    namaAkun: string;
    kategori: string;
    anggaran: number;
    realisasi: number;
    persentase: number;
  }>;
  title: string;
  colorClass: string;
  headerColor: string;
  tahun: number;
};

export default function AccountTable({
  items,
  title,
  colorClass,
  headerColor,
  tahun,
}: AccountTableProps) {
  const grouped = items.reduce(
    (acc, item) => {
      if (!acc[item.kategori]) acc[item.kategori] = [];
      acc[item.kategori].push(item);
      return acc;
    },
    {} as Record<string, typeof items>
  );

  const totalAllAnggaran = items.reduce((s, i) => s + i.anggaran, 0);
  const totalAllRealisasi = items.reduce((s, i) => s + i.realisasi, 0);
  const totalAllPct = safePercentage(totalAllRealisasi, totalAllAnggaran);

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">
            TA {tahun}
          </Badge>
          {title}
          <Badge className={`ml-auto text-[10px] px-2 py-0 h-5 border ${getRealisasiBadgeClass(totalAllPct)}`}>
            {formatPersentase(totalAllPct)}
          </Badge>
        </CardTitle>
        {/* Summary row */}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span>Total: <strong className="text-foreground">{formatRupiahShort(totalAllAnggaran)}</strong></span>
          <span>·</span>
          <span>Realisasi: <strong className="text-foreground">{formatRupiahShort(totalAllRealisasi)}</strong></span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop: table layout */}
        <div className="hidden md:block max-h-[500px] overflow-y-auto">
          {Object.entries(grouped).map(([kategori, groupItems]) => {
            const totalAnggaran = groupItems.reduce((s, i) => s + i.anggaran, 0);
            const totalRealisasi = groupItems.reduce((s, i) => s + i.realisasi, 0);
            const totalPct = safePercentage(totalRealisasi, totalAnggaran);

            return (
              <div key={kategori}>
                <div className={`px-4 py-2.5 border-b ${colorClass}`}>
                  <h3 className={`text-xs font-bold ${headerColor} uppercase tracking-wide`}>
                    {kategori}
                  </h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[11px] font-semibold w-[130px]">
                        Kode
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold min-w-[200px]">
                        Nama Akun
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold text-right whitespace-nowrap">
                        Anggaran
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold text-right whitespace-nowrap">
                        Realisasi
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold text-center w-[100px]">
                        Persentase
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell className="text-[11px] text-muted-foreground font-mono py-2">
                          {item.kodeAkun}
                        </TableCell>
                        <TableCell className="text-[11px] font-medium pl-4 py-2">
                          <span className="line-clamp-2">{item.namaAkun}</span>
                        </TableCell>
                        <TableCell className="text-[11px] text-right py-2 whitespace-nowrap">
                          <RupiahCell value={item.anggaran} />
                        </TableCell>
                        <TableCell className="text-[11px] text-right py-2 whitespace-nowrap">
                          <RupiahCell value={item.realisasi} />
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getRealisasiBarClass(item.persentase)}`}
                                style={{ width: `${Math.min(item.persentase, 100)}%` }}
                              />
                            </div>
                            <Badge className={`text-[10px] px-1.5 py-0 h-5 border whitespace-nowrap ${getRealisasiBadgeClass(item.persentase)}`}>
                              {formatPersentase(item.persentase)}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* Subtotal */}
                <div className={`px-4 py-2.5 ${colorClass} border-t font-semibold text-xs`}>
                  <div className="flex items-center justify-between">
                    <span>Subtotal {kategori}</span>
                    <div className="flex items-center gap-4">
                      <div className="min-w-[150px] flex justify-end whitespace-nowrap">
                        <RupiahCell value={totalAnggaran} />
                      </div>
                      <div className="min-w-[150px] flex justify-end whitespace-nowrap">
                        <RupiahCell value={totalRealisasi} />
                      </div>
                      <Badge className={`text-[10px] px-1.5 py-0 h-5 border whitespace-nowrap ${getRealisasiBadgeClass(totalPct)}`}>
                        {formatPersentase(totalPct)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile: card-based layout */}
        <div className="md:hidden max-h-[500px] overflow-y-auto p-3 space-y-2">
          {Object.entries(grouped).map(([kategori, groupItems]) => {
            const totalAnggaran = groupItems.reduce((s, i) => s + i.anggaran, 0);
            const totalRealisasi = groupItems.reduce((s, i) => s + i.realisasi, 0);
            const totalPct = safePercentage(totalRealisasi, totalAnggaran);

            return (
              <div key={kategori} className="space-y-2">
                {/* Category header */}
                <div className={`rounded-lg px-3 py-2 ${colorClass}`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xs font-bold ${headerColor} uppercase tracking-wide`}>
                      {kategori}
                    </h3>
                    <Badge className={`text-[9px] px-1.5 py-0 h-4 border ${getRealisasiBadgeClass(totalPct)}`}>
                      {formatPersentase(totalPct)}
                    </Badge>
                  </div>
                </div>
                {/* Items as cards */}
                {groupItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border bg-card p-3 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[11px] font-mono text-muted-foreground">{item.kodeAkun}</p>
                      <Badge className={`text-[9px] px-1.5 py-0 h-4 border shrink-0 ${getRealisasiBadgeClass(item.persentase)}`}>
                        {formatPersentase(item.persentase)}
                      </Badge>
                    </div>
                    <p className="text-xs font-medium leading-relaxed">{item.namaAkun}</p>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-muted-foreground">Anggaran: </span>
                        <span className="font-semibold"><RupiahCell value={item.anggaran} /></span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Realisasi: </span>
                        <span className="font-semibold"><RupiahCell value={item.realisasi} /></span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getRealisasiBarClass(item.persentase)}`}
                        style={{ width: `${Math.min(item.persentase, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {/* Subtotal */}
                <div className={`rounded-lg p-3 ${colorClass} text-xs font-semibold`}>
                  <div className="flex items-center justify-between">
                    <span>Subtotal {kategori}</span>
                    <div className="flex items-center gap-3">
                      <span><RupiahCell value={totalRealisasi} /></span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
