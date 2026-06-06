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
import { DashboardData, formatPersentase, getRealisasiBadgeClass, safePercentage } from "./types";
import RupiahCell from "./RupiahCell";
import { motion } from "framer-motion";
import { Landmark } from "lucide-react";

type APBDTableProps = {
  data: DashboardData;
};

export default function APBDTable({ data }: APBDTableProps) {
  const totalPendapatan = data.pendapatan.reduce((s, p) => s + p.anggaran, 0);
  const totalRealisasiPendapatan = data.pendapatan.reduce((s, p) => s + p.realisasi, 0);
  const totalBelanja = data.belanja.reduce((s, b) => s + b.anggaran, 0);
  const totalRealisasiBelanja = data.belanja.reduce((s, b) => s + b.realisasi, 0);
  const totalPembiayaan = data.pembiayaan.reduce((s, p) => s + p.anggaran, 0);
  const totalRealisasiPembiayaan = data.pembiayaan.reduce((s, p) => s + p.realisasi, 0);

  const pctPendapatan = safePercentage(totalRealisasiPendapatan, totalPendapatan);
  const pctBelanja = safePercentage(totalRealisasiBelanja, totalBelanja);
  const pctPembiayaan = safePercentage(totalRealisasiPembiayaan, totalPembiayaan);

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
          {/* Desktop: Traditional table layout */}
          <div className="hidden md:block max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent bg-emerald-50 sticky top-0 z-10">
                  <TableHead className="text-[11px] font-bold w-[130px]">
                    Kode
                  </TableHead>
                  <TableHead className="text-[11px] font-bold min-w-[200px]">
                    Uraian
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-right whitespace-nowrap">
                    Anggaran (Rp)
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-right whitespace-nowrap">
                    Realisasi (Rp)
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-center w-[85px]">
                    %
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* PENDAPATAN SECTION */}
                <TableRow className="bg-emerald-50/50">
                  <TableCell colSpan={5} className="font-bold text-xs text-emerald-800 py-2.5">
                    A. PENDAPATAN DAERAH
                  </TableCell>
                </TableRow>
                {data.pendapatan.map((item) => (
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
                    <TableCell className="text-[11px] text-center py-2">
                      <Badge
                        className={`text-[10px] px-1.5 py-0 h-5 border whitespace-nowrap ${getRealisasiBadgeClass(item.persentase)}`}
                      >
                        {formatPersentase(item.persentase)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-emerald-50/70 font-semibold">
                  <TableCell colSpan={2} className="text-xs text-right pr-4 py-2.5">
                    Total Pendapatan
                  </TableCell>
                  <TableCell className="text-xs text-right py-2.5 whitespace-nowrap">
                    <RupiahCell value={totalPendapatan} />
                  </TableCell>
                  <TableCell className="text-xs text-right py-2.5 whitespace-nowrap">
                    <RupiahCell value={totalRealisasiPendapatan} />
                  </TableCell>
                  <TableCell className="text-xs text-center py-2.5">
                    <Badge className={`text-[10px] px-1.5 py-0 h-5 border whitespace-nowrap ${getRealisasiBadgeClass(pctPendapatan)}`}>
                      {formatPersentase(pctPendapatan)}
                    </Badge>
                  </TableCell>
                </TableRow>

                {/* BELANJA SECTION */}
                <TableRow className="bg-red-50/50">
                  <TableCell colSpan={5} className="font-bold text-xs text-red-800 py-2.5">
                    B. BELANJA DAERAH
                  </TableCell>
                </TableRow>
                {data.belanja.map((item) => (
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
                    <TableCell className="text-[11px] text-center py-2">
                      <Badge
                        className={`text-[10px] px-1.5 py-0 h-5 border whitespace-nowrap ${getRealisasiBadgeClass(item.persentase)}`}
                      >
                        {formatPersentase(item.persentase)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-red-50/70 font-semibold">
                  <TableCell colSpan={2} className="text-xs text-right pr-4 py-2.5">
                    Total Belanja
                  </TableCell>
                  <TableCell className="text-xs text-right py-2.5 whitespace-nowrap">
                    <RupiahCell value={totalBelanja} />
                  </TableCell>
                  <TableCell className="text-xs text-right py-2.5 whitespace-nowrap">
                    <RupiahCell value={totalRealisasiBelanja} />
                  </TableCell>
                  <TableCell className="text-xs text-center py-2.5">
                    <Badge className={`text-[10px] px-1.5 py-0 h-5 border whitespace-nowrap ${getRealisasiBadgeClass(pctBelanja)}`}>
                      {formatPersentase(pctBelanja)}
                    </Badge>
                  </TableCell>
                </TableRow>

                {/* PEMBIAYAAN SECTION */}
                <TableRow className="bg-amber-50/50">
                  <TableCell colSpan={5} className="font-bold text-xs text-amber-800 py-2.5">
                    C. PEMBIAYAAN
                  </TableCell>
                </TableRow>
                {data.pembiayaan.map((item) => (
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
                    <TableCell className="text-[11px] text-center py-2">
                      <Badge
                        className={`text-[10px] px-1.5 py-0 h-5 border whitespace-nowrap ${getRealisasiBadgeClass(item.persentase)}`}
                      >
                        {formatPersentase(item.persentase)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Pembiayaan subtotal */}
                <TableRow className="bg-amber-50/70 font-semibold">
                  <TableCell colSpan={2} className="text-xs text-right pr-4 py-2.5">
                    Total Pembiayaan
                  </TableCell>
                  <TableCell className="text-xs text-right py-2.5 whitespace-nowrap">
                    <RupiahCell value={totalPembiayaan} />
                  </TableCell>
                  <TableCell className="text-xs text-right py-2.5 whitespace-nowrap">
                    <RupiahCell value={totalRealisasiPembiayaan} />
                  </TableCell>
                  <TableCell className="text-xs text-center py-2.5">
                    <Badge className={`text-[10px] px-1.5 py-0 h-5 border whitespace-nowrap ${getRealisasiBadgeClass(pctPembiayaan)}`}>
                      {formatPersentase(pctPembiayaan)}
                    </Badge>
                  </TableCell>
                </TableRow>

                {/* SURPLUS/DEFISIT */}
                <TableRow className="bg-slate-100 font-bold border-t-2 border-slate-300">
                  <TableCell colSpan={2} className="text-xs text-right pr-4 py-2.5">
                    SURPLUS / (DEFISIT)
                  </TableCell>
                  <TableCell className="text-xs text-right py-2.5 whitespace-nowrap">
                    <RupiahCell value={totalPendapatan - totalBelanja} />
                  </TableCell>
                  <TableCell className="text-xs text-right py-2.5 whitespace-nowrap">
                    <RupiahCell value={totalRealisasiPendapatan - totalRealisasiBelanja} />
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Mobile: Card-based layout for each item */}
          <div className="md:hidden max-h-[600px] overflow-y-auto p-3 space-y-2">
            {/* PENDAPATAN SECTION */}
            <div className="sticky top-0 z-10 bg-emerald-100/90 backdrop-blur-sm rounded-lg px-3 py-2">
              <p className="text-xs font-bold text-emerald-800">A. PENDAPATAN DAERAH</p>
            </div>
            {data.pendapatan.map((item) => (
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
              </div>
            ))}
            <div className="rounded-lg bg-emerald-50/70 p-3 flex items-center justify-between">
              <span className="text-xs font-semibold">Total Pendapatan</span>
              <Badge className={`text-[10px] px-1.5 py-0 h-5 border ${getRealisasiBadgeClass(pctPendapatan)}`}>
                {formatPersentase(pctPendapatan)}
              </Badge>
            </div>

            {/* BELANJA SECTION */}
            <div className="sticky top-0 z-10 bg-red-100/90 backdrop-blur-sm rounded-lg px-3 py-2 mt-3">
              <p className="text-xs font-bold text-red-800">B. BELANJA DAERAH</p>
            </div>
            {data.belanja.map((item) => (
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
              </div>
            ))}
            <div className="rounded-lg bg-red-50/70 p-3 flex items-center justify-between">
              <span className="text-xs font-semibold">Total Belanja</span>
              <Badge className={`text-[10px] px-1.5 py-0 h-5 border ${getRealisasiBadgeClass(pctBelanja)}`}>
                {formatPersentase(pctBelanja)}
              </Badge>
            </div>

            {/* PEMBIAYAAN SECTION */}
            <div className="sticky top-0 z-10 bg-amber-100/90 backdrop-blur-sm rounded-lg px-3 py-2 mt-3">
              <p className="text-xs font-bold text-amber-800">C. PEMBIAYAAN</p>
            </div>
            {data.pembiayaan.map((item) => (
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
              </div>
            ))}
            <div className="rounded-lg bg-amber-50/70 p-3 flex items-center justify-between">
              <span className="text-xs font-semibold">Total Pembiayaan</span>
              <Badge className={`text-[10px] px-1.5 py-0 h-5 border ${getRealisasiBadgeClass(pctPembiayaan)}`}>
                {formatPersentase(pctPembiayaan)}
              </Badge>
            </div>

            {/* SURPLUS/DEFISIT */}
            <div className="rounded-lg bg-slate-100 p-3 mt-3 border-t-2 border-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">SURPLUS / (DEFISIT)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Anggaran: </span>
                  <span className="font-bold"><RupiahCell value={totalPendapatan - totalBelanja} /></span>
                </div>
                <div>
                  <span className="text-muted-foreground">Realisasi: </span>
                  <span className="font-bold"><RupiahCell value={totalRealisasiPendapatan - totalRealisasiBelanja} /></span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
