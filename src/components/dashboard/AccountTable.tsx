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
import { formatRupiahFull, formatPersentase, getRealisasiBadgeClass, getRealisasiBarClass, safePercentage } from "./types";

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

  return (
    <Card className="shadow-md border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">
            TA {tahun}
          </Badge>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
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
                      <TableHead className="text-[11px] font-semibold w-[60px]">
                        Kode
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold">
                        Nama Akun
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold text-right">
                        Anggaran
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold text-right">
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
                        <TableCell className="text-[11px] text-muted-foreground font-mono">
                          {item.kodeAkun}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {item.namaAkun}
                        </TableCell>
                        <TableCell className="text-[11px] text-right font-mono">
                          {formatRupiahFull(item.anggaran)}
                        </TableCell>
                        <TableCell className="text-[11px] text-right font-mono">
                          {formatRupiahFull(item.realisasi)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getRealisasiBarClass(item.persentase)}`}
                                style={{ width: `${Math.min(item.persentase, 100)}%` }}
                              />
                            </div>
                            <Badge className={`text-[10px] px-1.5 py-0 h-5 border ${getRealisasiBadgeClass(item.persentase)}`}>
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
                      <span className="font-mono w-[120px] text-right">
                        {formatRupiahFull(totalAnggaran)}
                      </span>
                      <span className="font-mono w-[120px] text-right">
                        {formatRupiahFull(totalRealisasi)}
                      </span>
                      <Badge className={`text-[10px] px-1.5 py-0 h-5 border ${getRealisasiBadgeClass(totalPct)}`}>
                        {formatPersentase(totalPct)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
