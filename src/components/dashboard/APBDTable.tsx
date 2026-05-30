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
import { Landmark } from "lucide-react";

type APBDTableProps = {
  data: DashboardData;
};

export default function APBDTable({ data }: APBDTableProps) {
  const totalPendapatan = data.pendapatan.reduce((s, p) => s + p.anggaran, 0);
  const totalRealisasiPendapatan = data.pendapatan.reduce(
    (s, p) => s + p.realisasi,
    0
  );
  const totalBelanja = data.belanja.reduce((s, b) => s + b.anggaran, 0);
  const totalRealisasiBelanja = data.belanja.reduce(
    (s, b) => s + b.realisasi,
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
    >
      <Card className="shadow-md border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-100">
              <Landmark className="w-4 h-4 text-emerald-700" />
            </div>
            Anggaran Pendapatan dan Belanja Daerah
            <Badge variant="secondary" className="ml-auto text-[10px]">
              TA {data.tahun}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-emerald-50">
                  <TableHead className="text-[11px] font-bold w-[50px]">
                    Kode
                  </TableHead>
                  <TableHead className="text-[11px] font-bold">
                    Uraian
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-right">
                    Anggaran (Rp)
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-right">
                    Realisasi (Rp)
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-center w-[80px]">
                    %
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* PENDAPATAN SECTION */}
                <TableRow className="bg-emerald-50/50">
                  <TableCell colSpan={5} className="font-bold text-xs text-emerald-800 py-2">
                    A. PENDAPATAN DAERAH
                  </TableCell>
                </TableRow>
                {data.pendapatan.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="text-[11px] text-muted-foreground font-mono">
                      {item.kodeAkun}
                    </TableCell>
                    <TableCell className="text-[11px] font-medium pl-6">
                      {item.namaAkun}
                    </TableCell>
                    <TableCell className="text-[11px] text-right font-mono">
                      {formatRupiahFull(item.anggaran)}
                    </TableCell>
                    <TableCell className="text-[11px] text-right font-mono">
                      {formatRupiahFull(item.realisasi)}
                    </TableCell>
                    <TableCell className="text-[11px] text-center">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 h-5 ${
                          item.persentase >= 90
                            ? "bg-emerald-100 text-emerald-800"
                            : item.persentase >= 75
                              ? "bg-amber-100 text-amber-800"
                              : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {formatPersentase(item.persentase)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-emerald-50/70 font-semibold">
                  <TableCell colSpan={2} className="text-xs text-right pr-4">
                    Total Pendapatan
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono">
                    {formatRupiahFull(totalPendapatan)}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono">
                    {formatRupiahFull(totalRealisasiPendapatan)}
                  </TableCell>
                  <TableCell className="text-xs text-center">
                    <Badge className="text-[10px] px-1.5 py-0 h-5 bg-emerald-100 text-emerald-800">
                      {formatPersentase(
                        (totalRealisasiPendapatan / totalPendapatan) * 100
                      )}
                    </Badge>
                  </TableCell>
                </TableRow>

                {/* BELANJA SECTION */}
                <TableRow className="bg-red-50/50">
                  <TableCell colSpan={5} className="font-bold text-xs text-red-800 py-2">
                    B. BELANJA DAERAH
                  </TableCell>
                </TableRow>
                {data.belanja.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="text-[11px] text-muted-foreground font-mono">
                      {item.kodeAkun}
                    </TableCell>
                    <TableCell className="text-[11px] font-medium pl-6">
                      {item.namaAkun}
                    </TableCell>
                    <TableCell className="text-[11px] text-right font-mono">
                      {formatRupiahFull(item.anggaran)}
                    </TableCell>
                    <TableCell className="text-[11px] text-right font-mono">
                      {formatRupiahFull(item.realisasi)}
                    </TableCell>
                    <TableCell className="text-[11px] text-center">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 h-5 ${
                          item.persentase >= 90
                            ? "bg-emerald-100 text-emerald-800"
                            : item.persentase >= 75
                              ? "bg-amber-100 text-amber-800"
                              : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {formatPersentase(item.persentase)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-red-50/70 font-semibold">
                  <TableCell colSpan={2} className="text-xs text-right pr-4">
                    Total Belanja
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono">
                    {formatRupiahFull(totalBelanja)}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono">
                    {formatRupiahFull(totalRealisasiBelanja)}
                  </TableCell>
                  <TableCell className="text-xs text-center">
                    <Badge className="text-[10px] px-1.5 py-0 h-5 bg-emerald-100 text-emerald-800">
                      {formatPersentase(
                        (totalRealisasiBelanja / totalBelanja) * 100
                      )}
                    </Badge>
                  </TableCell>
                </TableRow>

                {/* PEMBIAYAAN SECTION */}
                <TableRow className="bg-amber-50/50">
                  <TableCell colSpan={5} className="font-bold text-xs text-amber-800 py-2">
                    C. PEMBIAYAAN
                  </TableCell>
                </TableRow>
                {data.pembiayaan.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="text-[11px] text-muted-foreground font-mono">
                      {item.kodeAkun}
                    </TableCell>
                    <TableCell className="text-[11px] font-medium pl-6">
                      {item.namaAkun}
                    </TableCell>
                    <TableCell className="text-[11px] text-right font-mono">
                      {formatRupiahFull(item.anggaran)}
                    </TableCell>
                    <TableCell className="text-[11px] text-right font-mono">
                      {formatRupiahFull(item.realisasi)}
                    </TableCell>
                    <TableCell className="text-[11px] text-center">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] px-1.5 py-0 h-5 ${
                          item.persentase >= 90
                            ? "bg-emerald-100 text-emerald-800"
                            : item.persentase >= 75
                              ? "bg-amber-100 text-amber-800"
                              : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {formatPersentase(item.persentase)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}

                {/* SURPLUS/DEFISIT */}
                <TableRow className="bg-slate-100 font-bold border-t-2 border-slate-300">
                  <TableCell colSpan={2} className="text-xs text-right pr-4">
                    SURPLUS / (DEFISIT)
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono">
                    {formatRupiahFull(totalPendapatan - totalBelanja)}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono">
                    {formatRupiahFull(
                      totalRealisasiPendapatan - totalRealisasiBelanja
                    )}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}
